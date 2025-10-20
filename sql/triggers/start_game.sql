create or replace function start_game() returns trigger
security definer
set search_path = public
AS $$
declare
  _seated jsonb;
  _simulated jsonb;
  _up smallint[];
  _notify smallint[];
  _slug text;
  _title varchar;
  _thumbnail_url varchar;
  _next smallint;
begin

  if (new.status = 'full'::table_status and old.status <> 'full'::table_status) then

    -- reorder seats
    update seats
    set seat = os.ord + 100
    from order_seats(new.id) as os
    where seats.table_id = new.id
    and os.id = seats.id;

    with repositioned as (
      select
          id,
          row_number() over () - 1 AS position
      FROM seats
      WHERE table_id = new.id
      order by seat )
    update seats
    set seat = r.position
    from repositioned r
    where seats.id = r.id;

    raise log '$ starting';

    select seated(new.id)
    into _seated;

    select simulate(new.id, null::varchar, '[{"type": "start"}]', '[null]'::jsonb)
    into _simulated;

    select array_agg(value::smallint)::smallint[]
    from jsonb_array_elements(_simulated->'up')
    into _up;

    select array_agg(value::smallint)::smallint[]
    from jsonb_array_elements(_simulated->'notify')
    into _notify;

    select slug, title, thumbnail_url
    from games
    where id = new.game_id
    into _slug, _title, _thumbnail_url;

    raise log '$ starting % up, %', _up, _simulated;

    insert into events (table_id, type, details, seat_id)
    select new.id as table_id, type, details, (_seated->(e.seat)->'seat') as seat_id
    from addable_events(_simulated->'added') as e;

    update tables
    set status = 'started'::table_status,
        up = _up
    where id = new.id;

    perform pgmq.send(
      'notifications',
      jsonb_build_object(
        'type', 'started',
        'table_id', new.id,
        'title', _title,
        'slug', _slug,
        'thumbnail_url', _thumbnail_url,
        'recipients', emails(new.id, null)
      ),
      0
    );

    perform pgmq.send(
      'notifications',
      jsonb_build_object(
        'type', 'up',
        'table_id', new.id,
        'title', _title,
        'slug', _slug,
        'thumbnail_url', _thumbnail_url,
        'recipients', emails(new.id, _notify),
        'prompts', (_simulated->'prompts'),
        'seats', _up
      ),
      0
    );

    raise log '$ game `%` started at table `%`', _slug, new.id;

    perform pgmq.wake_notify_consumer();
  end if;

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_table_filled on tables;

create trigger on_table_filled
after update on tables for each row execute function start_game();

create or replace function start_game() returns trigger
security definer
set search_path = public
AS $$
declare
  _seated jsonb;
  _simulated jsonb;
  _up smallint[];
  _slug text;
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

    select slug
    from games
    where id = new.game_id
    into _slug;

    raise log '$ starting % up, %', _up, _simulated;

    insert into events (table_id, type, details, seat_id)
    select new.id as table_id, type, details, (_seated->(e.seat)->'seat') as seat_id
    from addable_events(_simulated->'added') as e;

    update tables
    set status = 'started'::table_status,
        up = _up
    where id = new.id;

    --insert into notifications(type, table_id) values('started', new.id);

    --insert into notifications(type, table_id, seats) values('up', new.id, _up);

    raise log '$ game `%` started at table `%`', _slug, new.id;

  end if;

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_table_filled on tables;

create trigger on_table_filled
after update on tables for each row execute function start_game();

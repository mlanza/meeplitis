create or replace function start_game() returns trigger
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

    update seats
    set seat = public.seat(new.id, seats.player_id)
    where seats.table_id = new.id;

    _seated := (select seated(new.id));
    _simulated := (select simulate(new.id, '[{"type": "start"}]', null));
    _up := (select array_agg(value::smallint)::smallint[] from jsonb_array_elements(_simulated->'up'));
    _slug := (select slug from games where id = new.game_id);

    insert into events (table_id, type, details, seat_id)
    select new.id as table_id, type, details, (_seated->(e.seat)->'seat') as seat_id
    from addable_events(_simulated->'added') as e;

    update tables
    set status = 'started'::table_status,
        up = _up
    where id = new.id;

    insert into jobs(type, details)
    values ('started:notice', ('{"table_id": "' || new.id || '"}')::jsonb);

    insert into jobs(type, details)
    values ('up:notice', ('{"table_id": "' || new.id || '", "seats": ' || (_simulated->'notify')::jsonb || '}')::jsonb);

    raise log '$ game `%` started at table `%`', _slug, new.id;

  end if;

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_table_filled on tables;

create trigger on_table_filled
after update on tables for each row execute function start_game();

create or replace function start_game() returns trigger
AS $$
declare
  _seated jsonb;
  _events jsonb;
  _slug text;
  _next smallint;
begin

  if (new.status = 'full'::table_status and old.status <> 'full'::table_status) then

    -- reorder seats
    update seats
    set seq = os.ord + 100
    from order_seats(new.id) as os
    where seats.table_id = new.id
    and os.id = seats.id;

    _seated := (select seated(new.id));
    _events := (select simulate(new.id, '[{"type": "start"}]'::jsonb, null))->1;
    _slug := (select slug from games where id = new.game_id);

    insert into events (table_id, type, details, seat_id)
    select new.id as table_id, type, details, (_seated->(e.seat)->'seat') as seat_id
    from addable_events(_events) as e;

    update tables
    set started_at = now(),
        status = 'started'::table_status
    where id = new.id;

    raise log '$ game `%` started at table `%`', _slug, new.id;

  end if;

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_table_filled on tables;

create trigger on_table_filled
after update on tables for each row execute function start_game();

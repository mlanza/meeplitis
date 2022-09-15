create or replace function start_game() returns trigger
AS $$
declare
  _seated jsonb;
  _events jsonb;
begin

  if (new.status = 'full'::table_status and old.status <> 'full'::table_status) then
    _seated := (select seated(new.id));
    _events := (ohhell(_seated, '{}'::jsonb, '[]'::jsonb, '[{"type": "start"}]'::jsonb, null))->1;

    insert into events (table_id, event, details, seat_id)
    select new.id as table_id, type, details, (_seated->(e.seat)->'seat') as seat_id
    from add_events(_events) as e;

    update tables
    set started_at = now(),
        status = 'started'::table_status,
        foo = _events
    where id = new.id;

    raise info '$ game started at table %', new.id;

  end if;

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_table_filled on tables;

create trigger on_table_filled
after update on tables for each row execute function start_game();

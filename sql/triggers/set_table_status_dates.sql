create or replace function set_table_status_dates() returns trigger
AS $$
declare
  _seated jsonb;
  _events jsonb;
  _slug text;
  _next smallint;
begin

  update tables
  set updated_at = now()
  where id = new.id;

  if (new.status = 'started'::table_status and old.status <> 'started'::table_status) then
    update tables
    set started_at = now(),
        touched_at = now() -- important if just unlocked
    where id = new.id;

    insert into jobs(type, details)
    values ('started:notice', ('{"table_id": "' || new.id || '"}')::jsonb);
  end if;

  if (new.status = 'finished'::table_status and old.status <> 'finished'::table_status) then
    update tables
    set finished_at = now(),
        touched_at = now()
    where id = new.id;

    insert into jobs(type, details)
    values ('finished:notice', ('{"table_id": "' || new.id || '"}')::jsonb);
  end if;

  return new;

end;

$$ language plpgsql;

drop trigger if exists on_table_status_change on seats;

create trigger on_table_status_change
after update on seats for each row execute function set_table_status_dates();

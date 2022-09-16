create or replace function keep_table_dates() returns trigger
AS $$
begin

  update tables
  set updated_at = now()
  where id = new.id;

  if (new.status = 'started'::table_status and old.status <> 'started'::table_status) then
    update tables
    set started_at = now()
    where id = new.id;
  end if;

  if (new.status = 'finished'::table_status and old.status <> 'finished'::table_status) then
    update tables
    set finished_at = now()
    where id = new.id;
  end if;

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_table_changed on tables;

create trigger on_table_changed
after update on tables for each row execute function keep_table_dates();

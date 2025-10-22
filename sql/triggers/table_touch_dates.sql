create or replace function tables_touch_dates() returns trigger
language plpgsql as $$
begin
  if new.status = 'started'::table_status then
    new.started_at := now();
  elsif new.status = 'finished'::table_status then
    new.finished_at := now();
  end if;
  new.touched_at := now(); --key in synch with other date
  return new;
end$$;

drop trigger if exists trg_tables_touch_dates on tables;
create trigger trg_tables_touch_dates
before update of status on tables
for each row
when (old.status is distinct from new.status)
execute function tables_touch_dates();

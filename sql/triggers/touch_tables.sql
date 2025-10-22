create or replace function touch_tables() returns trigger
language plpgsql as $$
begin
  if new.touched_at is not distinct from old.touched_at then
    new.touched_at := now();
  end if;
  return new;
end$$;

drop trigger if exists trg_tables_touch on tables;

create trigger trg_tables_touch
before update on tables
for each row
execute function touch_tables();

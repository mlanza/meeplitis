create or replace function touched() returns trigger
AS $$
begin

  update tables
  set last_touch_id = new.id,
      touched_at = now()
  where id = new.table_id;

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_touched on events;

create trigger on_touched
after insert on events for each row execute function touched();

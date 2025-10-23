create or replace function notify_up_changed() returns trigger
language plpgsql as $$
declare
  _message jsonb;
begin
  -- This trigger fires on every UPDATE OF up, even if NEW.up = OLD.up.
  -- Some updates intentionally rewrite the same value, and those should still notify.
  select to_jsonb(pl) || jsonb_build_object('type','up','up',new.up)
    into _message
  from playing pl
  where pl.table_id = new.id;

  perform pgmq.send('notifications', _message, 0);
  perform pgmq.consume_notifications();
  return null;
end$$;

drop trigger if exists trg_notify_up_changed on tables;

create trigger trg_notify_up_changed
after update of up on tables
for each row
execute function notify_up_changed();

create or replace function notify_table_status_changed() returns trigger
language plpgsql as $$
declare
  _message jsonb;
begin
  select to_jsonb(pl) || jsonb_build_object('type','table_status_changed','status',new.status)
    into _message
  from playing pl
  where pl.table_id = new.id;

  perform pgmq.send('notifications', _message, 0);
  perform pgmq.wake_notify_consumer();
  return null;
end$$;

drop trigger if exists trg_notify_table_status_changed on tables;

create trigger trg_notify_table_status_changed
after update of status on tables
for each row
when (old.status is distinct from new.status)
execute function notify_table_status_changed();

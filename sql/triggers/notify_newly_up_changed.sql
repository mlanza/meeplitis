create or replace function notify_newly_up_changed() returns trigger
language plpgsql as $$
declare
  _message   jsonb;
  _newly_up  smallint[];
begin
  -- Values present in NEW.up but not in OLD.up.
  -- Treat NULL arrays as empty.
  select coalesce(
           array(
             select e
             from unnest(coalesce(new.up, '{}'::smallint[])) as e
             except
             select e
             from unnest(coalesce(old.up, '{}'::smallint[])) as e
           ),
           '{}'::smallint[]
         )
    into _newly_up;

  select to_jsonb(pl) || jsonb_build_object('type','newly_up','newly_up', _newly_up)
    into _message
  from playing pl
  where pl.table_id = new.id;

  perform pgmq.send('notifications', _message, 0);
  perform pgmq.consume_notifications();
  return null; -- AFTER trigger
end$$;

drop trigger if exists trg_notify_newly_up_changed on tables;

create trigger trg_notify_newly_up_changed
after update of up on tables
for each row
when (old.up is distinct from new.up)  -- only fire when the array actually changed
execute function notify_newly_up_changed();

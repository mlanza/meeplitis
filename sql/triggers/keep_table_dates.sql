create or replace function keep_table_dates() returns trigger
as $$
declare
  _message jsonb;
begin
  if (new.status = 'started'::table_status and old.status <> 'started'::table_status) then
    update tables
    set started_at = now(),
        touched_at = now()
    where tables.id = new.id;
  end if;

  if (new.status = 'finished'::table_status and old.status <> 'finished'::table_status) then
    update tables
    set finished_at = now(),
        touched_at = now()
    where tables.id = new.id;

    select to_jsonb(pl)
           || jsonb_build_object(
                'type', 'finished',
                'outcome', outcome(new.id)
              )
    into _message
    from playing pl
    where pl.table_id = new.id;

    perform pgmq.send('notifications', _message, 0);
  end if;

  perform pgmq.wake_notify_consumer();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_table_changed on tables;

create trigger on_table_changed
after update on tables for each row when (pg_trigger_depth() = 0)
execute function keep_table_dates();

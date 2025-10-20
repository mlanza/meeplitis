create or replace function pgmq.revive(queue_name text, msg_id bigint)
returns bigint as $$
declare
  msg jsonb;
  new_id bigint;
  archive_table text := format('pgmq.a_%I', queue_name);
begin
  execute format('select message from %s where msg_id = $1', archive_table)
    into msg
    using msg_id;

  if msg is null then
    raise exception 'No archived message % found in queue %', msg_id, queue_name;
  end if;

  select pgmq.send(queue_name, msg) into new_id;

  -- optional: remove it from archive after successful requeue
  execute format('delete from %s where msg_id = $1', archive_table)
    using msg_id;

  return new_id;
end;
$$ language plpgsql;

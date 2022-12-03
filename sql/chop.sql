create or replace function chop(_table_id varchar, _event_id varchar)
returns int
security definer
set search_path = public
language plpgsql
as $$
declare
_count int;
_seq bigint;
begin

  update tables
  set last_touch_id = _event_id
  where id = _table_id;

  select seq
  from events
  where id = _event_id
  and table_id = _table_id
  into _seq;

  select count(*)
  from events
  where table_id = _table_id
  and seq > _seq
  into _count;

  delete
  from events
  where table_id = _table_id
  and seq > _seq;

  return _count;

end;
$$;


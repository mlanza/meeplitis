create or replace function undo(_table_id varchar, _event_id varchar)
  returns int
  security definer
  set search_path = public
  language plpgsql
as $$
declare
  _count int;
begin

  select chop
  from chop(_table_id, _event_id, true)
  into _count;

  return _count;

end;
$$;

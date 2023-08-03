create or replace function abandons()
  returns int
  security definer
  set search_path = public
  language plpgsql
as $$
declare
  _count int;
begin

  WITH updated AS (
    update delinquent_tables
    set status = 'abandoned'
    where status = 'started'
    returning 1
  )
  select count(*)
  FROM updated
  into _count;

  return _count;

end;
$$;

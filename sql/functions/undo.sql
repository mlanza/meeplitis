create or replace function undo(_table_id varchar, _event_id varchar)
  returns int
  security definer
  set search_path = public
  language plpgsql
as $$
declare
  _count int;
  _seat int;
  _up int[];
  _allow boolean;
begin

  select up
  from tables
  where id = _table_id
  into _up;

  select seat
  from seats
  where table_id = _table_id and player_id = auth.uid()
  into _seat;

  select array_position(_up, _seat) is not null
  into _allow;

  if not _allow then
    raise '$ only % can undo % at table %, user % tried', _up, _event_id, _table_id, auth.uid();
  end if;

  select chop from chop(_table_id, _event_id, true) into _count;

  return _count;

end;
$$;

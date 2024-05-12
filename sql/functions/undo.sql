create or replace function undo(_table_id varchar, _event_id varchar)
  returns int
  security definer
  set search_path = public
  language plpgsql
as $$
declare
  _count int;
begin

  if not exists (
    select *
      from tables t
      join seats s on s.player_id = auth.uid() and s.table_id = t.id and t.id = _table_id and s.seat = any(t.up)) then
    raise '$ % not authorized to undo `%` at table `%`', auth.uid(), _event_id, _table_id;
  end if;

  select chop from chop(_table_id, _event_id, true) into _count;

  return _count;

end;
$$;

create or replace function snapshot(_table_id varchar, _event_id varchar, _limit int) returns void
security definer
set search_path = public
as $$
declare
  _event record;
  _seq bigint;
  _state jsonb;
begin
  select seq
  from events
  where table_id = _table_id and id = _event_id
  into _seq;

  for _event in select id from events where table_id = _table_id and seq >= _seq order by seq limit _limit loop
    select simulate(_table_id, _event.id)->'state'
    into _state;

    raise log '$ snapshot at % for % is %', _table_id, _event.id, _state;

    update events
    set snapshot = _state
    where table_id = _table_id and id = _event.id;
  end loop;
end;
$$ language plpgsql;

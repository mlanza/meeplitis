create or replace function snapshot(_table_id varchar, _event_id varchar) returns void
security definer
set search_path = public
as $$
declare
  _snapshot jsonb;
begin
  select simulate(_table_id, _event_id)
  into _snapshot;

  raise log '$ took snapshot at % for event %', _table_id, _event_id;

  update events
  set snapshot = _snapshot
  where table_id = _table_id and id = _event_id;
end;
$$ language plpgsql;

create or replace function snapshot(_table_id varchar, _event_id varchar, _limit int) returns void
security definer
set search_path = public
as $$
declare
  _event record;
  _seq bigint;
begin
  select seq
  from events
  where table_id = _table_id and id = _event_id
  into _seq;

  for _event in select id from events where table_id = _table_id and seq >= _seq order by seq limit _limit loop
    perform snapshot(_table_id, _event.id);
  end loop;
end;
$$ language plpgsql;

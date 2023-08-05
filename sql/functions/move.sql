  create or replace function move(_table_id varchar, _commands jsonb)
returns table(id varchar, table_id varchar, type varchar, seat_id varchar)
security definer
set search_path = public
language plpgsql
as $$
declare
_seat int;
begin

select seat as seats
from seats s
where s.table_id = _table_id
and player_id = auth.uid()
into _seat;

return query (select move(_table_id, commands, _seat));
end;
$$;

create or replace function move(_table_id varchar, _commands jsonb, _seat int)
returns table(id varchar, table_id varchar, type varchar, seat_id varchar)
language plpgsql
as $$
declare
_count int;
_recipients int;
_simulated jsonb;
_up smallint[];
_status table_status;
begin

if _seat is null then
  raise exception 'only players may issue moves';
end if;

select t.status
from tables t
where t.id = _table_id
into _status;

if _status <> 'started' then
  raise exception 'can only issues moves at active tables';
end if;

select count(*)
from jsonb_array_elements_text(_commands)
into _count;

if _count = 0 then
  raise exception 'must provide command(s)';
end if;

raise log '$ seat % at table `%` moves issuing % command(s): %', _seat, _table_id, _count, _commands;

_simulated := (select simulate(_table_id, _commands, _seat));
_up := (select array_agg(value::smallint)::smallint[] from jsonb_array_elements(_simulated->'up'));

update tables
set up = _up
where tables.id = _table_id;

select jsonb_array_length((_simulated->'notify')::jsonb)
into _recipients;

if _recipients > 0 then
  insert into jobs(type, details)
  values ('up:notice', ('{"table_id": "' || _table_id || '", "seats": ' || (_simulated->'notify')::jsonb || '}')::jsonb);
end if;

return query
insert into events (table_id, type, details, undoable, seat_id, snapshot)
select _table_id, e.type, e.details, e.undoable, s.id as seat_id, e.snapshot
from addable_events(_simulated->'added') e
left join seats s on s.table_id = _table_id and s.seat = e.seat
returning events.id, events.table_id, events.type, events.seat_id;
end;
$$;

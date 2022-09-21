create or replace function move(_table_id varchar, _commands jsonb, _seat int)
returns table(id varchar, table_id varchar, type varchar, details jsonb, seat_id varchar)
language plpgsql
as $$
declare
_count int;
_simulated jsonb;
_up smallint[];
begin

_count := (select coalesce(array_length(array(select jsonb_array_elements_text(_commands)), 1),0));

if _count = 0 then
  raise exception 'must provide at least 1 command';
end if;

raise log '$ seat % moved at table `%` executing % commands', _seat, _table_id, _count;

_simulated := (select simulate(_table_id, _commands, _seat));
_up := (select array_agg(value::smallint)::smallint[] from jsonb_array_elements(_simulated->'up'));

raise log '$ seat % moved at table `%` adding `%`', _seat, _table_id, _simulated->'added';

update tables
set up = _up
where tables.id = _table_id;

return query
insert into events (table_id, type, details, seat_id)
select s.table_id, e.type, e.details, s.id as seat_id
from addable_events(_simulated->'added') e
join seats s on s.table_id = _table_id and s.seat = e.seat
returning events.id, events.table_id, events.type, events.details, events.seat_id;

end; $$

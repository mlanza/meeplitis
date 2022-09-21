create or replace function move(_table_id varchar, _commands jsonb, _seat smallint)
returns table(id varchar, table_id varchar, type varchar, details jsonb, seat_id varchar)
language plpgsql
as $$
declare
_simulated jsonb;
begin

_simulated := (select simulate(_table_id, _commands, _seat));

raise log '$ seat % moved at table `%` adding `%`', _seat, _table_id, _simulated->'added';

return query
insert into events (table_id, type, details, seat_id)
select s.table_id, e.type, e.details, s.id as seat_id
from addable_events(_simulated->'added') e
join seats s on s.table_id = _table_id and s.seat = e.seat
returning events.id, events.table_id, events.type, events.details, events.seat_id;

end; $$

create or replace function join_table(_table_id varchar, _player_id uuid = auth.uid())
returns varchar
language plpgsql
as $$
declare
_seat_id varchar;
begin

_seat_id = (select id from seats where table_id = _table_id and player_id is null limit 1);

update seats
set player_id = _player_id
where table_id = _table_id
and id = _seat_id;

raise log '$ player `%` joins seat `%` at table `%`', _player_id, _seat_id, _table_id;

return _seat_id;

end; $$

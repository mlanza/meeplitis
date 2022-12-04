create or replace function leave_table(_table_id varchar, _player_id uuid = auth.uid())
returns varchar
security definer
language plpgsql
as $$
declare
_seat_id varchar;
begin

update seats
set
  player_id = null
where table_id = _table_id
and player_id = _player_id
returning id into _seat_id;

raise log '$ player `%` leaves seat `%` at table `%`', _player_id, _seat_id, _table_id;

return _seat_id;

end; $$

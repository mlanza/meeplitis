create or replace function leave_table(_table_id varchar, _player_id uuid = auth.uid())
returns varchar
language plpgsql
as $$
declare
v_seat_id varchar;
begin

v_seat_id = (select id from seats where table_id = _table_id and player_id = _player_id limit 1);

update seats
set
  player_id = null,
  joined_at = null
where table_id = _table_id
and player_id = _player_id
and id = v_seat_id;

raise log '$ player %s leaves table %s', _player_id, _table_id;

return v_seat_id;

end; $$

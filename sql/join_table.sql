create or replace function join_table(_table_id varchar, _player_id uuid = auth.uid())
returns varchar
language plpgsql
as $$
declare
v_seat_id varchar;
begin

v_seat_id = (select id from seats where table_id = $1 and player_id is null limit 1);

update seats
set
  player_id = $2,
  joined_at = now()
where table_id = $1
and id = v_seat_id;

raise log '$ player `%` joins seat `%` at table `%`', $2, v_seat_id, $1;

return v_seat_id;

end; $$

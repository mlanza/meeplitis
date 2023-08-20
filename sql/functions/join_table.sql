create or replace function join_table(_table_id varchar, _player_id uuid = auth.uid())
returns varchar
security definer
language plpgsql
as $$
declare
_seat_id varchar;
begin

_seat_id = (select id from seats where table_id = _table_id and player_id is null order by seat limit 1);

if _seat_id is not null then
  update seats
  set player_id = _player_id,
      joined_at = now()
  where table_id = _table_id
  and id = _seat_id;

  raise log '$ player `%` joins seat `%` at table `%`', _player_id, _seat_id, _table_id;
else
  raise log '$ player `%` unable to join table `%`', _player_id, _table_id;
end if;

return _seat_id;

end; $$

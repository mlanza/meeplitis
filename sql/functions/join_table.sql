create or replace function join_table(_table_id varchar, _player_id uuid = auth.uid())
returns varchar
security definer
language plpgsql
as $$
declare
_seat_id varchar;
_capacity smallint;
_going smallint;
begin

select capacity,
  (select count(*) from tables t join seats s on s.table_id = t.id and s.player_id = _player_id and t.status in ('open', 'started')) as going
from profiles where id = _player_id
into _capacity, _going;

if (_capacity is not null and _going >= _capacity) then
  raise 'You''re at capacity and cannot join additional tables at this time.';
end if;

select id
from seats
where table_id = _table_id and player_id is null order by seat limit 1
into _seat_id;

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

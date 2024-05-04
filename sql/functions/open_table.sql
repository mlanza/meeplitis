create or replace function open_table(_game_id varchar, _release varchar, _config jsonb, _remark varchar, _seats int, _dummy boolean, _player_id uuid default auth.uid())
returns varchar
security definer
language plpgsql
as $$
declare
_id varchar;
_capacity smallint;
_going smallint;
begin

select capacity,
  (select count(*) from tables t join seats s on s.table_id = t.id and s.player_id = _player_id and t.status in ('open', 'started')) as going
from profiles where id = _player_id
into _capacity, _going;

if (_capacity is not null and _going >= _capacity) then
  raise 'You''re at capacity and cannot open additional tables at this time.';
end if;

select coalesce(_release, release) from games
where id = _game_id
into _release;

insert into tables (game_id, config, remark, created_by, release, dummy)
values (_game_id, _config, _remark, _player_id, _release, _dummy)
returning id into _id;

insert into seats (table_id, player_id, seat, joined_at)
select
  table_id,
  case seat when 0 then _player_id else null end as player_id,
  seat,
  now()
from (select _id as table_id, generate_series(0, _seats - 1) as seat) as seated;

raise log '$ opened table `%` with % seats', _id, _seats;

return _id;

end; $$

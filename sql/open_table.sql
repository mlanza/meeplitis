create or replace function open_table(_game_id varchar, _config jsonb, _scored bool, _remark varchar, _seats int, _player_id uuid default auth.uid())
returns varchar
security definer
language plpgsql
as $$
declare
_fn varchar;
_id varchar;
begin

_fn = (select fn from games where id = _game_id);

insert into tables (game_id, config, scored, remark, created_by, fn)
values (_game_id, _config, _scored, _remark, _player_id, _fn)
returning id into _id;

insert into seats (table_id, player_id, seat, joined_at)
select
  table_id,
  case seat when 0 then _player_id else null end as player_id,
  seat,
  now()
from (select _id as table_id, generate_series(0, _seats - 1) as seat) as seated;

raise log '$ opened % `%` with % seats', case _scored when true then 'scored table' else 'unscored table' end, _id, _seats;

return _id;

end; $$

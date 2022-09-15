create or replace function open_table(_game_id varchar, _config jsonb, _scored bool, _seats smallint, _player_id uuid)
returns varchar
language plpgsql
as $$
declare
_id varchar;
begin

insert into tables (game_id, config, scored, created_by)
values (_game_id, _config, _scored, _player_id)
returning id into _id;

insert into seats (table_id, player_id, seat)
select
  table_id,
  case seat when 1 then _player_id else null end as player_id,
  seat
from (select _id as table_id, generate_series(1, _seats) as seat) as seated;

raise log '$ opened % `%` with % seats', case _scored when true then 'scored table' else 'unscored table' end, _id, _seats;

return _id;

end; $$

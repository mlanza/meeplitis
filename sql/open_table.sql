create or replace function open_table(_player_ids uuid[], _game_id varchar)
returns varchar
language plpgsql
as $$
declare
_id varchar;
begin

if exists (select 1 from (select *, exists(select 1 from auth.users where id = unnest) as present from unnest(_player_ids)) as users where present = false) then
  raise exception 'Unknown players'
  using hint = 'Confirm all players are valid';
end if;

_id := generate_uid(11);

insert into tables (id, game_id, created_by)
values (_id, _game_id, _player_ids[1]);

insert into seats (id, table_id, player_id, seq)
select
  id,
  table_id,
  _player_ids[seq] as player_id ,
  seq
from (select generate_uid(3) as id, _id as table_id, generate_series(1, cardinality(_player_ids) + 1) as seq) as seated;

return _id;

end; $$

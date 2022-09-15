create or replace function open_table(_game_id varchar, _config jsonb, variadic _player_ids uuid[])
returns varchar
language plpgsql
as $$
declare
_id varchar;
begin

if exists (select 1
    from (
      select id, exists (select 1 from profiles where id = l.id) as present
      from (select *
            from unnest(_player_ids) as id) as l
            where l.id is not null) as x
      where present = false) then
  raise exception 'Unknown players'
  using hint = 'Confirm all players are valid';
end if;

_id := generate_uid(11);

insert into tables (id, game_id, config, created_by)
values (_id, _game_id, _config, _player_ids[1]);

insert into seats (id, table_id, player_id)
select
  id,
  table_id,
  _player_ids[seq] as player_id
from (select generate_uid(3) as id, _id as table_id, generate_series(1, cardinality(_player_ids)) as seq) as seated;

return _id;

end; $$

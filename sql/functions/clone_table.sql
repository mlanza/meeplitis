create or replace function clone_table(_table_id varchar, _release varchar, _config jsonb, _cloned_by uuid, _players uuid[])
returns varchar
security definer
language plpgsql
as $$
declare
_id varchar;
_now timestamp;
begin

select now()
into _now;

insert into tables(game_id, release, config, status, clone_id, dummy, created_by)
select game_id, coalesce(_release, release), coalesce(_config, config), status, _table_id, true, _cloned_by from tables where id = _table_id
returning id into _id;

insert into seats(table_id, id, config, player_id, seat, joined_at, created_at)
select _id, id, config, coalesce(_players[seat + 1], player_id), seat, _now, _now
from seats where table_id = _table_id order by seat;

insert into events(table_id, id, seat_id, type, details, undoable, created_at)
select _id, id, seat_id, type, details, undoable, _now
from events where table_id = _table_id order by seq;

raise log '$ cloned table `%` to `%` with players %', _table_id, _id, _players;

return _id;

end; $$

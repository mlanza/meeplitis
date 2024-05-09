create or replace function clone_table(_table_id varchar, _release varchar, _config jsonb, _players uuid[], _cloned_by uuid = auth.uid())
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

insert into tables(game_id, release, config, last_touch_id, joined_at, started_at, finished_at, touched_at, status, up, seating, clone_id, dummy, created_by)
select
  game_id,
  coalesce(_release, release),
  coalesce(_config, config),
  last_touch_id,
  case when joined_at is null then null else _now end,
  case when started_at is null then null else _now end,
  case when finished_at is null then null else _now end,
  case when touched_at is null then null else _now end,
  status,
  up,
  seating,
  _table_id,
  true,
  _cloned_by
from tables where id = _table_id
returning id into _id;

insert into seats(table_id, id, config, player_id, seat, joined_at, created_at)
select _id, id, config, coalesce(_players[(row_number() OVER (order by seat))], player_id), seat, _now, _now
from seats where table_id = _table_id order by seat;

insert into events(table_id, id, seat_id, type, details, undoable, created_at)
select _id, id, seat_id, type, details, undoable, _now
from events where table_id = _table_id order by seq;

raise log '$ cloned table `%` to `%` with players %', _table_id, _id, _players;

return _id;

end; $$

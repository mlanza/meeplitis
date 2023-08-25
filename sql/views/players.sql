create or replace view open_players as

select *
from profiles p
where exists (
  select *
  from profiles p2
  join seats s on s.player_id = p2.id
  join tables t on t.id = s.table_id and t.status = 'open'
  where p2.id = p.id);

create or replace view started_players as

select *
from profiles p
where exists (
  select *
  from profiles p2
  join seats s on s.player_id = p2.id
  join tables t on t.id = s.table_id and t.status = 'started'
  where p2.id = p.id);

create or replace view finished_players as

select *
from profiles p
where exists (
  select *
  from profiles p2
  join seats s on s.player_id = p2.id
  join tables t on t.id = s.table_id and t.status = 'finished'
  where p2.id = p.id);


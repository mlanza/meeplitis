create view active_players as

select *
from profiles p
where exists (
  select *
  from profiles p2
  join seats s on s.player_id = p2.id
  join tables t on t.id = s.table_id and t.status in ('open', 'started', 'finished')
  where p2.id = p.id);

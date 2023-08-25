create or replace view profiles_with_activity as
select *,
  1 as all_tables,
  (select count(*)
    from profiles p2
    join seats s on s.player_id = p2.id
    join tables t on t.id = s.table_id and t.status = 'open'
    where p2.id = p.id) as open_tables,
  (select count(*)
    from profiles p2
    join seats s on s.player_id = p2.id
    join tables t on t.id = s.table_id and t.status = 'started'
    where p2.id = p.id) as started_tables
from profiles p;

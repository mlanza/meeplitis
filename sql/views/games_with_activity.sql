create or replace view games_with_activity as
select *,
      (select count(*) from tables t where t.game_id = g.id) as all_tables,
      (select count(*) from tables t where t.game_id = g.id and t.status = 'open') as open_tables,
      (select count(*) from tables t where t.game_id = g.id and t.status = 'started') as started_tables
from games g;

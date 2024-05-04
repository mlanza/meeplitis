create or replace view games_with_activity as
select *,
      (select count(*) from tables t where t.game_id = g.id and not t.dummy) as all_tables,
      (select count(*) from tables t where t.game_id = g.id and t.status = 'open' and not t.dummy) as open_tables,
      (select count(*) from tables t where t.game_id = g.id and t.status = 'started' and not t.dummy) as started_tables
from games g;

create or replace view tables_since_touched as
select *,
  extract(epoch from now()::timestamp - touched_at::timestamp)::int as seconds_since_touched,
  extract(day FROM now()::timestamp - touched_at::timestamp)::int as days_since_touched,
  touched_at < now() - INTERVAL '30 days' as stale,
  exists (select 1 from seats s join profiles p on p.id = s.player_id where s.table_id = tables.id and p.retain_history) as retain
from tables
order by touched_at, created_at;

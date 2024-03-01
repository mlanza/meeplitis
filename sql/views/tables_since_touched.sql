create or replace view tables_since_touched as
select *,
  extract(epoch from now()::timestamp - touched_at::timestamp)::int as seconds_since_touched,
  extract(day FROM (now()::timestamp - touched_at::timestamp)::int as days_since_touched,
  touched_at < now() - INTERVAL '30 days' and status = 'started' as stale,
  touched_at < now() - INTERVAL '30 days' and status = 'finished' and exists(select 1 from events e where e.table_id = tables.id) as plump
from tables
order by touched_at, created_at;

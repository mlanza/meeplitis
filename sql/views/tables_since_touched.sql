create or replace view tables_since_touched as
select *,
  now()::timestamp - touched_at::timestamp as since_touched,
  extract(epoch from now()::timestamp - touched_at::timestamp)::int as seconds_since_touched
from tables
order by touched_at, created_at;

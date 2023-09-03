create or replace view delinquent_tables as
select *
from tables_since_touched
where status = 'started'
and touched_at < now() - INTERVAL '30 days'
order by touched_at;

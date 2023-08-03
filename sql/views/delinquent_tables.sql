create or replace view delinquent_tables as
select *
from tables
where started_at is not null
and finished_at is null
and status = 'started'
and coalesce(touched_at, started_at) < now() - INTERVAL '30 days'
order by started_at;

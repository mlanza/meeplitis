create or replace view profiles_with_activity as
select pp.*,
  u.last_sign_in_at,
  x.all_tables,
  x.open_tables,
  x.started_tables
from profiles pp join (
  select
    p.id,
    count(distinct s.table_id) as all_tables,
    count(distinct case when t.status = 'open' then s.table_id end) as open_tables,
    count(distinct case when t.status = 'started' then s.table_id end) as started_tables
  from profiles p
  left join seats s on s.player_id = p.id
  left join tables t on s.table_id = t.id
  group by p.id) x on x.id = pp.id
join auth.users u on u.id = pp.id;

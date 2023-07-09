create or replace function seat_configs(_table_id varchar)
returns jsonb
language plpgsql
as $$
begin

return (select jsonb_agg(s.config)::jsonb as seated
  from (select s.config
  from seats s
  left join profiles p on p.id = s.player_id
  where s.table_id = _table_id
  order by s.seat) as s);
end; $$

create or replace function seated(_table_id varchar)
returns jsonb
security definer
language plpgsql
as $$
begin

return (select json_agg(json_build_object('player_id', s.player_id, 'username', s.username, 'seat_id', s.id, 'avatar_url', s.avatar_url)) as seated
  from (select s.player_id, p.username, s.id, p.avatar_url
  from seats s
  join profiles p on p.id = s.player_id
  join auth.users u on u.id = s.player_id
  where s.table_id = _table_id
  order by s.seat) as s);
end; $$

SELECT
  game_id,
  id as table_id,
  null as seat_id,
  null as move_id,
  null as seat,
  null as player,
  'start' as event,
  start as details,
  'confirmed' as status,
  created_at as confirmed_at,
  0 as stack,
  null as seq
FROM tables
UNION
SELECT
  t.game_id,
  m.table_id,
  m.seat_id,
  m.id as move_id,
  s.seq as seat,
  p.username as player,
  m.event,
  m.details as jsonb,
  m.status,
  m.confirmed_at,
  1 as stack,
  m.seq
FROM moves m
JOIN tables t on t.id = m.table_id
JOIN seats s on s.table_id = m.table_id and s.id = m.seat_id
LEFT JOIN profiles p on p.id = s.player_id
ORDER BY stack, seq;

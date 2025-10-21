create or replace view playing as
select
  t.id as table_id,
  g.slug,
  g.title,
  g.thumbnail_url,
  t."release",
  coalesce(
    json_agg(
      json_build_object('email', u.email, 'name', p.username, 'delegate_id', p.delegate_id)
      order by s.seat
    ) filter (where s.seat is not null),
    '[]'::json
  )::jsonb as seated
from tables t
join games g on g.id = t.game_id
left join seats s on s.table_id = t.id
left join auth.users u on u.id = s.player_id
left join profiles p on p.id = s.player_id
group by t.id, g.slug, g.title, g.thumbnail_url, t."release";

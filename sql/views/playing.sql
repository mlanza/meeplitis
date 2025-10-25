drop view if exists playing;

create or replace view playing as
with base as (
  select
    t.id as table_id,
    g.slug,
    g.title,
    g.thumbnail_url,
    t.game_id,
    t."release",
    t.up,
    t.status,
    seated(t.id)::jsonb as seated
  from tables t
  join games g on g.id = t.game_id
)
select
  table_id,
  slug,
  title,
  thumbnail_url,
  game_id,
  "release",
  up,
  seated,
  case
    when status = 'finished' then (
      select jsonb_agg(
               jsonb_build_object('place', s.place, 'username', p.username, 'brief', s.brief)
               order by s.place, s.seat
             )
      from seats s
      join profiles p on p.id = s.player_id
      where s.table_id = base.table_id
    )
    else null
  end as outcome
from base;

create or replace view notices as
select
    j.*,
    (j.details->'seats')::jsonb as seats,
    t.id as table_id,
    g.title, g.slug, g.thumbnail_url,
    (select json_agg(json_build_object('email', u.email, 'name', p.username)) as recipients
            from tables t
            join seats s on s.table_id = t.id
            join jobs jj on t.id = (jj.details->>'table_id')::varchar and (j.type <> 'up:notice' or (j.details->'seats')::jsonb @> (s.seat::text)::jsonb)
            join auth.users u on u.id = s.player_id
            join profiles p on p.id = s.player_id
            where jj.seq = j.seq)
from tables t
join games g on g.id = t.game_id
join jobs j on t.id = (j.details->>'table_id')::varchar
where j.type in ('started:notice', 'up:notice', 'finished:notice');

create or replace view notices as
select
    n.*,
    case n.type when 'finished' then outcome(t.id) else null end as outcome,
    g.title,
    g.slug,
    g.thumbnail_url,
    emails(t.id, n.seats) as recipients
from tables t
join games g on g.id = t.game_id
join notifications n on t.id = n.table_id

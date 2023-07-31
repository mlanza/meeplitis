create or replace view tables_with_placement as

select t.*, e.details->'places' as placement
from tables t
left join events e on t.id = e.table_id and t.last_touch_id = e.id and e.type = 'finished'

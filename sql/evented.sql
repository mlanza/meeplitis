create or replace function evented(_table_id varchar)
returns jsonb
language plpgsql
as $$
begin

return (select json_agg(json_build_object('id', id, 'type', type, 'details', details, 'seat', seat_id)) as evented
  from (select id, type, details, seat_id
  from events
  where table_id = _table_id
  order by seq) as e);

end; $$

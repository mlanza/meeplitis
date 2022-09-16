create or replace function evented(_table_id varchar)
returns jsonb
language plpgsql
as $$
begin

return (select json_agg(json_build_object('id', id, 'type', type, 'details', details, 'seat', seat)) as evented
  from (select e.id, e.type, e.details, s.seat
        from events e
        join seats s on s.table_id = e.table_id and s.id = e.seat_id
        where e.table_id = _table_id
        order by e.seq) as e);

end; $$

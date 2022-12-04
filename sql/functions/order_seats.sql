drop function order_seats(_table_id varchar);

create or replace function order_seats(_table_id varchar)
returns table(id varchar, ord smallint)
language plpgsql
as $$
declare
_seating seating_mode;
begin

_seating := (select seating from tables where tables.id = _table_id);

if (_seating = 'random'::seating_mode) then

  return query
  select seats.id, (row_number() OVER (order by random()))::smallint as ord
  from seats
  where table_id = _table_id;
else
  return query
  select seats.id, (row_number() OVER (order by joined_at))::smallint as ord
  from seats
  where table_id = _table_id;
end if;

end; $$

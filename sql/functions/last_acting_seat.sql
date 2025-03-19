--drop function undoables2;
create or replace function last_acting_seat(_table_id varchar)
returns varchar
language plpgsql
as $$
declare
begin

return seat_id
  FROM events
  WHERE table_id = _table_id
  AND seat_id is not null
  ORDER BY seq DESC
  LIMIT 1;

end;
$$;

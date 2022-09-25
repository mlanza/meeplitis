create or replace function perspective(_table_id varchar) returns jsonb as $$
declare
_seats int[];
begin

select array[seat] as seats
  from seats s
  where table_id = _table_id
  and player_id = auth.uid()
  union (select '{}' as seats)
  order by seats desc
  limit 1
  into _seats;

return (select simulate(_table_id, '[]'::jsonb, _seats));

end;
$$ language plpgsql;

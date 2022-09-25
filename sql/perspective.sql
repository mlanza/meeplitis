create or replace function perspective(_table_id varchar) returns jsonb
security definer
set search_path = public
as $$
declare
_seat int;
begin

select seat as seats
from seats s
where table_id = _table_id
and player_id = auth.uid()
into _seat;

return (select simulate(_table_id, '[]'::jsonb, _seat));

end;
$$ language plpgsql;

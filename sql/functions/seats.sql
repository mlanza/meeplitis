create or replace function seats(_table_id varchar, _player_id uuid default null)
returns smallint[]
language plpgsql
as $$
declare
_seats smallint[];
begin

select coalesce(ARRAY_AGG(seat),'{}') AS seats
from seats
where table_id = _table_id
and player_id = coalesce(_player_id, auth.uid())
into _seats;

return _seats;
end; $$

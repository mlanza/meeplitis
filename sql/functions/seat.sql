create or replace function seat(_table_id varchar, _player_id uuid default null)
returns smallint
language plpgsql
as $$
declare
_seat smallint;
begin

_seat := (select seat
from seats
where table_id = _table_id
and player_id = coalesce(_player_id, auth.uid()));

_seat := (select count(*) as proposed
from seats
where table_id = _table_id
and seat < _seat);

return _seat;
end; $$

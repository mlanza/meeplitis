create or replace function seat(_table_id varchar, _player_id uuid)
returns smallint
language plpgsql
as $$
declare
_seq smallint;
_seat smallint;
begin

_seq := (select seat
from seats
where table_id = _table_id
and player_id = coalesce(_player_id, auth.uid()));

_seat := (select count(*) as proposed
from seats
where table_id = _table_id
and seat < _seq);

return _seat;
end; $$

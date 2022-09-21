create or replace function perspective(p_table_id varchar, p_seat smallint default null) returns jsonb as $$
declare
_simulated jsonb;
begin

_simulated := (select simulate(p_table_id, '[]'::jsonb, p_seat));

return _simulated;
end;
$$ language plpgsql;

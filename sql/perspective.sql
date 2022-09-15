create or replace function perspective(p_table_id varchar, p_seat smallint) returns jsonb as $$
declare
v_result jsonb;
begin

v_result := (select play(p_table_id, '[]'::jsonb, p_seat));

return v_result;
end;
$$ language plpgsql;

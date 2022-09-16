create or replace function simulate(_table_id varchar, _commands jsonb, _seat smallint) returns jsonb as $$
declare
v_fn text;
v_result jsonb;
v_seated jsonb;
v_evented jsonb;
v_config jsonb;
begin

v_seated := (select seated(_table_id));
v_evented := (select evented(_table_id));
v_config := (select config from tables where id = _table_id);
v_fn := (select fn from tables where id = _table_id);
v_result := (select case v_fn when 'ohhell' then ohhell(v_seated, v_config, v_evented, _commands, _seat) else null end);

return v_result;
end;
$$ language plpgsql;

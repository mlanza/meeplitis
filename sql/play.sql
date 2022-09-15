create or replace function play(p_table_id varchar, p_commands jsonb, p_seat smallint) returns jsonb as $$
declare
v_slug text;
v_result jsonb;
v_seated jsonb;
v_evented jsonb;
v_config jsonb;
begin

v_seated := (select seated(p_table_id));
v_evented := (select evented(p_table_id));
v_config := (select config from tables where id = p_table_id);
v_slug := (select g.slug from tables t join games g on g.id = t.game_id where t.id = p_table_id limit 1);
v_result := (select case v_slug when 'ohhell' then ohhell(v_seated, v_config, v_evented, p_commands, p_seat) else null end);

return v_result;
end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _commands jsonb, _seat int) returns jsonb as $$
declare
_fn text;
_result jsonb;
_seated jsonb;
_events jsonb;
_config jsonb;
begin

_seated := (select seated(_table_id));
_events := (select evented(_table_id));
_config := (select config from tables where id = _table_id);
_fn := (select fn from tables where id = _table_id limit 1);
_result := (select case v_fn when 'ohhell' then ohhell(_seated, _config, _events, _commands, _seat) else null end);

return _result;
end;
$$ language plpgsql;

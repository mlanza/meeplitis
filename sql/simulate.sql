create or replace function simulate(_table_id varchar, _commands jsonb, _seat int) returns jsonb
as $$
declare
_fn text;
_result jsonb;
_seated jsonb;
_events jsonb;
_config jsonb;
_sql text;
begin

select seated(_table_id)
into _seated;

select evented
from evented(_table_id)
into _events;

select config
from tables
where id = _table_id
into _config;

select fn
from tables
where id = _table_id
into _fn;

--_result := (select case _fn when 'ohhell' then ohhell(_seated, _config, _events, _commands, array[_seat]) else null end);
-- dynamically choose which fn to execute
select 'select ' || _fn || '(''' || _seated || ''', ''' || _config || ''', ''' || _events || ''', ''' || _commands || ''', array[' || _seat || '])'
into _sql;

execute _sql into _result;

return _result;
end;
$$ language plpgsql;

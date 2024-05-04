create or replace function simulate_local(_fn varchar, _payload jsonb)
returns jsonb
language plpgsql
as $$
declare
_result jsonb;
begin

EXECUTE 'select * from ' || _fn || '(' || '''' || _payload::varchar || '''' || ')' into _result;

return _result;
end;
$$;

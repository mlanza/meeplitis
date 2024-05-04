create or replace function simulate_local(_fn varchar, _payload jsonb)
returns jsonb
language plpgsql
as $$
declare
_result jsonb;
begin

select case _fn
      when 'ohhell' then ohhell(_payload)
      when 'mexica' then mexica(_payload)
      else null end
into _result;

return _result;
end;
$$;

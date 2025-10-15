create or replace function simulate_remote(_slug varchar, _payload jsonb)
returns jsonb
language plpgsql
as $$
declare
_status int;
_result jsonb;
begin

SET statement_timeout = 10000;

raise log '$ simulate remote for % with payload %', _slug, _payload;

select status, content from http(('POST'::varchar, ('https://miwfiwpgvfhggfnqtfso.supabase.co/functions/v1/' || _slug)::varchar, ARRAY[http_header('Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODUwMzIzMywiZXhwIjoxOTU0MDc5MjMzfQ.i1l7NNGYF7mChifi8X-Cn_tis-us1Zq1ntyVW-Amdf8')], 'application/json', _payload::varchar)::http_request)
into _status, _result;

raise log '$ simulate remote  for % status % with result %', _slug, _status, _result;

if _result is null or _status > 222 then
  raise exception 'Unable to process game % payload % ', _slug, _payload;
end if;

return _result;
end;
$$;

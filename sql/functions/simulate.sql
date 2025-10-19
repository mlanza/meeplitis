create or replace function simulate(_table_id varchar, _event_id varchar, _commands jsonb, _seen jsonb) returns jsonb
security definer
set search_path = public
as $$
begin
  return simulate(hydrate(_table_id, _event_id, _commands, _seen));
end;
$$ language plpgsql;

create or replace function simulate(_payload jsonb)
returns jsonb
security definer
set search_path = public,extensions
as $$
declare
_slug text := _payload->>'slug';
_release text := _payload->>'release';
_req varchar := _payload->>'req';
_status int;
_result jsonb;
begin

--raise log '$ simulating % #% -> %', _slug, _req, _payload;

select status, content
from http(('POST'::varchar, ('https://miwfiwpgvfhggfnqtfso.supabase.co/functions/v1/' || _slug || '-' || _release)::varchar, ARRAY[http_header('Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODUwMzIzMywiZXhwIjoxOTU0MDc5MjMzfQ.i1l7NNGYF7mChifi8X-Cn_tis-us1Zq1ntyVW-Amdf8')], 'application/json', _payload::varchar)::http_request)
into _status, _result;

if _result is null or _status > 222 then
  raise exception 'Unable to process % payload % ', _slug, _payload;
end if;

--raise log '$ simulated % #% (%) -> %', _slug, _req, _status, _result;

return _result;

end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _commands jsonb, _seat int) returns jsonb
security definer
set search_path = public
as $$
declare
begin

return simulate(hydrate(_table_id, _commands, _seat));

end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _event_id varchar, _commands jsonb, _seat int) returns jsonb
security definer
set search_path = public
as $$
begin

return simulate(hydrate(_table_id, _event_id, _commands, _seat));

end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _event_id varchar, _seats jsonb) returns jsonb
security definer
set search_path = public
as $$
begin

return simulate(hydrate(_table_id, _event_id, _seats));

end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _event_id varchar) returns jsonb
security definer
set search_path = public
as $$
declare
begin

return simulate(hydrate(_table_id, _event_id));

end;
$$ language plpgsql;

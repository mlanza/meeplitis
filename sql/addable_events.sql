drop function addable_events(_events jsonb);
create or replace function addable_events(_events jsonb)
returns table(type text, details jsonb, seat smallint)
language plpgsql
as $$
begin
return query
select
  (value->>'type')::text as type,
  (value->'details')::jsonb as details,
  (value->>'seat')::smallint as seat
from (
select value::jsonb
from jsonb_array_elements_text(_events)) as s;
end; $$

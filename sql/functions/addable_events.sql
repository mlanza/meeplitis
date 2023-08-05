drop function addable_events(_events jsonb);
create or replace function addable_events(_events jsonb)
returns table(type text, details jsonb, undoable bool, seat smallint, snapshot jsonb)
language plpgsql immutable
as $$
begin
return query
select
  (value->>'type')::text as type,
  (value->'details')::jsonb as details,
  (value->'undoable')::bool as undoable,
  (value->>'seat')::smallint as seat,
  (value->>'snapshot')::jsonb as snapshot
from (
select value::jsonb
from jsonb_array_elements_text(_events)) as s;
end; $$

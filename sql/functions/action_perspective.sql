create or replace function action_perspective(_table_id varchar, _seat int) returns jsonb
security definer
set search_path = public
as $$
declare
  _hydrate jsonb;
begin
  -- get the base hydrated state with no commands
  _hydrate := hydrate(_table_id, '[]'::jsonb, _seat);

  -- set/override the view to "action"
  _hydrate := _hydrate || jsonb_build_object('view', 'action');

  return simulate(_hydrate);
end;
$$ language plpgsql;

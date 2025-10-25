create or replace function move_prompt(_table_id varchar, _seat int) returns jsonb
security definer
set search_path = public
as $$
declare
  _hydrate jsonb;
  _result jsonb;
  _site_prompt text;
  _game_prompt text;
  _prompt text;
begin
  -- base hydrated state with no commands
  _hydrate := hydrate(_table_id, '[]'::jsonb, _seat);

  -- override the view to "action"
  _hydrate := _hydrate || jsonb_build_object('view', 'action');

  -- run the simulation first
  _result := simulate(_hydrate);

  -- fetch prompts
  select s.move_prompt
  into _site_prompt
  from settings s
  where s.id is true
  limit 1;

  select g.move_prompt
  into _game_prompt
  from tables t
  join games g on g.id = t.game_id
  where t.id::text = _table_id
  limit 1;

  -- combine prompts with two line breaks
  _prompt := _site_prompt || E'\n\n' || _game_prompt;

  -- add prompt after simulate
  _result := _result || jsonb_build_object('prompt', _prompt);

  return _result;
end;
$$ language plpgsql;

create or replace function outcome(_table_id varchar)
returns jsonb
security definer
language plpgsql
as $$
declare
  _outcome json;
begin

select json_agg(json_build_object('place', place, 'username', username, 'brief', brief)) as outcome
from (
  select s.place,  p.username, s.brief
  from seats s
  join profiles p on p.id = s.player_id
  where table_id = _table_id
  order by place, seat) s
into _outcome;

return _outcome;

end;
$$;

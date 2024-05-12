create or replace function shell(_table_id varchar)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
_table jsonb;
_seated jsonb;
_evented jsonb;
begin

if auth.uid() != '5e6b12f5-f24c-4fd3-8812-f537778dc5c2' then
  raise exception '$ No authority to access table `%`', _table_id;
end if;

raise log '$ Shell access was used at table `%` by %', _table_id, auth.uid();

select json_build_object('slug', g.slug, 'id', t.id, 'game_id', t.game_id, 'release', t.release, 'config', t.config)
into _table
from tables t
join games g on g.id = t.game_id
where t.id = _table_id;

select seated into _seated from seated(_table_id);
select evented into _evented from evented(_table_id);

return ('{"table": ' || _table::varchar || ', "seated": ' ||  _seated::varchar || ', "evented": ' || _evented::varchar || '}')::jsonb;

end;
$$;

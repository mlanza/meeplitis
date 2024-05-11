create or replace function shell(_table_id varchar, _user_id uuid)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
_admins int;
_table jsonb;
_seated jsonb;
_evented jsonb;
begin

select count(*)
into _admins
from admins where user_id = _user_id;

if _admins = 0 then
  raise exception '$ moment for % at table `%` was denied', _user_id, _table_id;
end if;

raise log '$ moment for % at table `%` was granted', _user_id, _table_id;

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

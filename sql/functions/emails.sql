create OR replace function emails(_table_id varchar, _seats smallint[] default null) returns jsonb
security definer
set search_path = public
as $$
declare
  _emails jsonb;
begin
  select json_agg(json_build_object('email', u.email, 'name', p.username)) as recipients
  from tables t
  join seats s on s.table_id = t.id
  join auth.users u on u.id = s.player_id
  join profiles p on p.id = s.player_id
  where t.id = _table_id
  and (_seats is null or s.seat = ANY(_seats))
  into _emails;

  return _emails;
END;
$$ language plpgsql;

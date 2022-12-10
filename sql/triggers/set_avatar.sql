create or replace function set_avatar() returns trigger
AS $$
declare
  _avatar_url varchar;
  _status int;
begin

  select concat('http://www.gravatar.com/avatar/', md5((select email from auth.users where id = new.id))) as avatar_url
  into _avatar_url;

  select status
  from http_get(concat(_avatar_url, '?s=5&d=404')) -- does this user have an avatar?
  into _status;

  update profiles
  set avatar_url = case _status when 200 then _avatar_url else null end
  where profiles.id = new.id;

  raise log '$ updated avatar for `%` (%) with status %', new.username, new.id, _status;

  return new;

end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_modified on profiles;

create trigger on_profile_modified
after insert or update on profiles for each row
when (pg_trigger_depth() < 1)
execute function set_avatar();

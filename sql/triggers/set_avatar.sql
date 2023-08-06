create or replace function set_avatar() returns trigger
AS $$
declare
  _avatar_url varchar;
  _status int;
begin

  select concat('https://www.gravatar.com/avatar/', md5((select email from auth.users where id = new.id))) as avatar_url
  into _avatar_url;

  select status
  from http_get(concat(_avatar_url, '?s=5&d=404')) -- does this user have an avatar?
  into _status;

  if _status = 200 then
    update profiles
    set avatar_url = _avatar_url
    where profiles.id = new.id
    and _status = 200;

    raise log '$ updated avatar for `%`', new.username;
  end if;

  return new;

end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_modified on profiles;

create trigger on_profile_modified
after insert or update on profiles for each row
when (pg_trigger_depth() < 1)
execute function set_avatar();

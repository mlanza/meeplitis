create or replace function create_profile() returns trigger
AS $$
begin

  raise log '$ user with email `%` registered', new.email;

  insert into profiles(id, avatar_url)
  values (new.id, concat('http://www.gravatar.com/avatar/', md5(new.email)));

  return new;

end;
$$ language plpgsql security definer;

drop trigger if exists on_user_registered on auth.users;

create trigger on_user_registered
after insert on auth.users for each row
execute function create_profile();

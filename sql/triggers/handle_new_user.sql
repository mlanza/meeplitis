create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, avatar_url)
  values (new.id, concat('https://www.gravatar.com/avatar/', md5(new.email), '?s=300'));
  return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


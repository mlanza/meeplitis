create or replace function public.handle_update_user_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set avatar_url = concat('https://www.gravatar.com/avatar/', md5(new.email), '?s=300')
  where id = new.id;
  return new;
end;
$$;

create trigger on_user_email_updated
after update of email on auth.users
for each row execute procedure public.handle_update_user_email();

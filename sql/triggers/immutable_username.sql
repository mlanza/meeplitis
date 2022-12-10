create function immutable_usernames() returns trigger
  language plpgsql as
$$
begin
   if new.username <> old.username then
      raise exception 'usernames cannot be modified';
   end if;
   return new;
end;
$$;

create trigger immutable_usernames
   before update on profiles for each row
   execute procedure immutable_usernames();

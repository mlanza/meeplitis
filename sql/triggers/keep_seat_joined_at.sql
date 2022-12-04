create or replace function keep_seat_joined_at() returns trigger
AS $$
begin

  if (new.player_id <> old.player_id) then
    update tables
    set joined_at = case when new.player_id is null then null else now() end
    where id = new.id;
  end if;

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_player_changed on seats;

create trigger on_player_changed
after update on seats for each row execute function keep_seat_joined_at();

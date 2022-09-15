drop trigger if exists on_seating_change on seats;
drop function update_table_status;
create or replace function update_table_status() returns trigger
AS $$
declare
  total smallint;
  vacant smallint;
  occupied smallint;
  _seated jsonb;
  _events jsonb;
begin

  if (coalesce(new.player_id,'00000000-0000-0000-0000-000000000000') <> coalesce(old.player_id,'00000000-0000-0000-0000-000000000000')) then
    if not exists (select * from tables where id = new.table_id and status = 'open'::table_status) then
      raise exception 'cannot change seating once the table is full';
    end if;

    total := (select count(*)
    from seats
    where table_id = new.table_id);

    vacant := (select count(*)
    from seats
    where table_id = new.table_id
    and player_id is null);

    occupied := (select count(*)
    from seats
    where table_id = new.table_id
    and player_id is not null);

    update tables
    set seating_change_at = now(),
        status = (case when vacant = total then 'vacant'
                      when occupied = total then 'full'
                      else 'open' end)::table_status
    where id = new.table_id
    and status = 'open';
  end if;

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_seating_change on seats;

create trigger on_seating_change
after update on seats for each row execute function update_table_status();

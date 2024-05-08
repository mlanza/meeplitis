create OR replace function restrict_joined_seats()
returns trigger AS $$
begin
  if exists(
    select 1
    from seats s
    join tables t on s.table_id = t.id and not t.dummy
    where s.player_id = new.player_id
    and s.table_id = new.table_id
  ) then
    raise exception 'Players cannot occupy more than one seat at a table.';
  end if;
  return new;
end;
$$ language plpgsql;

create or replace trigger player_seat_assignment_check
before insert or update on seats
for each row execute function restrict_joined_seats();

create or replace function finish_game() returns trigger
AS $$
begin

  raise log '$ finished game at table `%`', new.table_id;

  update seats
  set metric = x.metric,
      place = x.place
  from (
    select
      s.table_id,
      s.id,
      e.place,
      e.metric
    from seats s
    join (
      select
        row_number() over() - 1 as seat,
        metric,
        place
      from (
        select
          jsonb_array_elements(details->'metric') as metric,
          jsonb_array_elements(details->'places')::smallint as place
        from events
        where type = 'finish' and table_id = new.table_id
      ) as e
    ) e on s.table_id = new.table_id and e.seat = s.seat
  ) as x
  where seats.table_id = x.table_id and seats.id = x.id;

  update tables
  set finished_at = now(),
      status = 'finished'::table_status
  where id = new.table_id;

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_finished_event_added on events;

create trigger on_finished_event_added
after insert on events for each row when (new.type = 'finish')
execute function finish_game();

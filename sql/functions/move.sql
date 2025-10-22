create or replace function move(_table_id varchar, _commands jsonb)
returns table(id varchar, table_id varchar, type varchar, seat_id varchar)
security definer
set search_path = public
language plpgsql
as $$
declare
  _seat int;
begin
  select s.seat
    into _seat
  from seats s
  where s.table_id = _table_id
    and s.player_id = auth.uid();

  return query
  select m.id, m.table_id, m.type, m.seat_id
  from move(_table_id, _commands, _seat) as m;
end;
$$;

create or replace function move(_table_id varchar, _commands jsonb, _seat int)
returns table(id varchar, table_id varchar, type varchar, seat_id varchar)
security definer
set search_path = public
language plpgsql
as $$
declare
  _count int;
  _status table_status;
  _simulated jsonb;
begin
  if _seat is null then
    raise exception 'only players may issue moves';
  end if;

  select t.status into _status
  from tables t
  where t.id = _table_id;

  if _status <> 'started' then
    raise exception 'can only issue moves at active tables';
  end if;

  select count(*) into _count
  from jsonb_array_elements_text(_commands);

  if _count = 0 then
    raise exception 'must provide command(s)';
  end if;

  raise log '$ seat % at table `%` moves issuing % command(s): %', _seat, _table_id, _count, _commands;

  _simulated := simulate(_table_id, _commands, _seat);

  update tables
     set up = (
       select array_agg(value::smallint)::smallint[]
       from jsonb_array_elements(_simulated->'up')
     )
   where tables.id = _table_id;

  update profiles p
     set last_moved_at = now()
    from seats s
   where p.id = s.player_id
     and s.table_id = _table_id
     and s.seat = _seat;

  return query
  insert into events (table_id, type, details, undoable, seat_id, snapshot)
  select _table_id, e.type, e.details, e.undoable, s.id as seat_id, e.snapshot
    from addable_events(_simulated->'added') e
    left join seats s
      on s.table_id = _table_id
     and s.seat = e.seat
  returning events.id, events.table_id, events.type, events.seat_id;
end;
$$;

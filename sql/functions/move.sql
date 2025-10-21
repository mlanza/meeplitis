create or replace function move(_table_id varchar, _commands jsonb)
returns table(id varchar, table_id varchar, type varchar, seat_id varchar)
security definer
set search_path = public, pgmq
language plpgsql
as $$
declare
_seat int;
begin
  select seat as seats
  from seats s
  where s.table_id = _table_id
  and player_id = auth.uid()
  into _seat;

  return query (select move(_table_id, commands, _seat));
end;
$$;

create or replace function move(_table_id varchar, _commands jsonb, _seat int)
returns table(id varchar, table_id varchar, type varchar, seat_id varchar)
security definer
set search_path = public, pgmq
language plpgsql
as $$
declare
  _count int;
  _status table_status;
  _simulated jsonb;
  _up smallint[];
  _notify smallint[];
  _message jsonb;
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

  _simulated := (select simulate(_table_id, _commands, _seat));
  _up := (select array_agg(value::smallint)::smallint[] from jsonb_array_elements(_simulated->'up'));

  update tables
  set up = _up
  where tables.id = _table_id;

  update profiles p
  set last_moved_at = now()
  from seats s
  where p.id = s.player_id
    and s.table_id = _table_id
    and s.seat = _seat;

  select array(
    select cast(value as smallint)
    from jsonb_array_elements_text(_simulated->'notify')
  ) into _notify;

  select to_jsonb(pl)
         || jsonb_build_object(
              'type', 'up',
              'prompts', _simulated->'prompts'
            )
  into _message
  from playing pl
  where pl.table_id = _table_id;

  perform pgmq.send('notifications', _message, 0);
  perform pgmq.wake_notify_consumer();

  return query
  insert into events (table_id, type, details, undoable, seat_id, snapshot)
  select _table_id, e.type, e.details, e.undoable, s.id as seat_id, e.snapshot
  from addable_events(_simulated->'added') e
  left join seats s on s.table_id = _table_id and s.seat = e.seat
  returning events.id, events.table_id, events.type, events.seat_id;
end;
$$;

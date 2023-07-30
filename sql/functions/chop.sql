create or replace function chop(_table_id varchar, _event_id varchar)
  returns int
  security definer
  set search_path = public
  language plpgsql
as $$
declare
  _count int;
begin

  select chop from chop(_table_id, _event_id, false) into _count;

  return _count;

end;
$$;

create or replace function chop(_table_id varchar, _event_id varchar, _verify bool)
  returns int
  security definer
  set search_path = public
  language plpgsql
as $$
declare
  _last_touch_id varchar;
  _seat_id varchar;
  _count int;
  _seq bigint;
  _up smallint[];
  _simulated jsonb;
begin

  select seat_id
  from events
  where table_id = _table_id and id = _event_id
  into _seat_id;

  select id, seq
  from events
  where table_id = _table_id
  and seq < (select seq from events where table_id = _table_id and id = _event_id)
  order by seq desc
  limit 1
  into _last_touch_id, _seq;

  if _seat_id is null then --skip past automatic events
    return chop(_table_id, _last_touch_id, _verify);
  end if;

  if _verify and exists(select *
    from events
    where table_id = _table_id
    and seq > _seq
    and undoable = false) then
      raise '$ cannot undo %#%', _table_id, _event_id;
  end if;

  with deleted as (
    delete from events
    where table_id = _table_id
    and seq > _seq returning *)
  select count(*)
  from deleted
  into _count;

  if _verify = false then
    select simulate(_table_id, _last_touch_id)
    into _simulated;

    select array_agg(value::smallint)::smallint[]
    from jsonb_array_elements(_simulated->'up')
    into _up;
  end if;

  update tables
  set status = 'started',
      last_touch_id = _last_touch_id,
      up = case when _verify = false then _up else up end,
      touched_at = now(),
      finished_at = null
  where id = _table_id;

  raise log '$ chopped % at % to %, up %, verify %', _count, _table_id, _last_touch_id, _up, _verify;

  return _count;

end;
$$;

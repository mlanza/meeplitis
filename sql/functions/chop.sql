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
  _count int;
  _seq bigint;
begin

  select id, seq
  from events
  where table_id = _table_id
  and seq < (select seq from events where table_id = _table_id and id = _event_id)
  order by seq desc
  limit 1
  into _last_touch_id, _seq;

  if _verify and exists(select *
    from events
    where table_id = _table_id
    and seq > _seq
    and undoable = false) then
    raise '$ cannot undo %#%', _table_id, _event_id;
  end if;

  update tables
  set last_touch_id = _last_touch_id,
      status = 'started',
      finished_at = null
  where id = _table_id;

  with deleted as (
    delete from events
    where table_id = _table_id
    and seq > _seq returning *)
  select count(*)
  from deleted
  into _count;

  return _count;

end;
$$;

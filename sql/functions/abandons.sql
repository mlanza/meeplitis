create or replace function abandons()
  returns int
  security definer
  set search_path = public
  language plpgsql
as $$
declare
  _count int := 0;
  _record record;
  _cursor cursor for select id, touched_at from tables_since_touched where status = 'abandoned' and stale;
begin

  open _cursor;
  loop
      fetch next from _cursor into _record;
      exit when not found;

      update tables
      set status = 'abandoned'
      where id = _record.id;

      _count := _count + 1;

      raise log '$ abandoned table % last touched at %', _record.id, _record.touched_at;
  end loop;
  close _cursor;

  return _count;

end;
$$;

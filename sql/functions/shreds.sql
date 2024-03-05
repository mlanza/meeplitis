create or replace function shreds()
  returns int
  security definer
  set search_path = public
  language plpgsql
as $$
declare
  _count int := 0;
  _record record;
  _cursor cursor for select id, touched_at from tables_since_touched where status = 'finished' and shredded_at is null and stale and not keep and not retain;
begin

  open _cursor;
  loop
      fetch next from _cursor into _record;
      exit when not found;

      delete
      from events
      where table_id = _record.id;

      update tables
      set shredded_at = now()
      where id = _record.id;

      _count := _count + 1;

      raise log '$ shredded table % last touched at %', _record.id, _record.touched_at;
  end loop;
  close _cursor;

  raise log '$ shredded % tables', _count;

  return _count;

end;
$$;

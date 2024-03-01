create or replace function abandons()
  returns int
  security definer
  set search_path = public
  language plpgsql
as $$
declare
  _count int := 0;
  _stale_table_record record;
  _stale_tables_cursor cursor for select id, touched_at from tables_since_touched where stale;
begin

  open _stale_tables_cursor;
  loop
      fetch next from _stale_tables_cursor into _stale_table_record;
      exit when not found;

      update tables
      set status = 'abandoned'
      where id = _stale_table_record.id;

      _count := _count + 1;

      raise log '$ abandoned table % last touched at %', _stale_table_record.id, _stale_table_record.touched_at;
  end loop;
  close _stale_tables_cursor;

  raise log '$ abandoned % tables', _count;

  return _count;

end;
$$;

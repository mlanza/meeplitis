create or replace function thins()
  returns int
  security definer
  set search_path = public
  language plpgsql
as $$
declare
  _count int := 0;
  _plump_table_record record;
  _plump_tables_cursor cursor for select id, touched_at from tables_since_touched where plump and not keep;
begin

  open _plump_tables_cursor;
  loop
      fetch next from _plump_tables_cursor into _plump_table_record;
      exit when not found;

      delete
      from events
      where table_id = _plump_table_record.id;

      update tables
      set thinned_at = now()
      where id = _plump_table_record.id;

      _count := _count + 1;

      raise log '$ thinned table % last touched at %', _plump_table_record.id, _plump_table_record.touched_at;
  end loop;
  close _plump_tables_cursor;

  return _count;

end;
$$;

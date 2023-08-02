create or replace function strike(_table_id varchar)
returns void
language plpgsql
as $$
begin

delete from events where table_id = _table_id;
delete from seats where table_id = _table_id;
delete from tables where id = _table_id;

end;
$$;

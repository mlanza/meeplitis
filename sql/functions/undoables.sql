create or replace function undoables(_table_id varchar)
returns varchar[]
language plpgsql
as $$
declare
  _seq bigint;
begin

  select seq
  from events
  where table_id = _table_id
  and undoable = false
  order by seq desc
  limit 1
  into _seq;

return (select array(select id
        from events
        where table_id = _table_id
        and _seq is not null
        and seq > _seq
        order by seq) as undoables);

end;
$$;


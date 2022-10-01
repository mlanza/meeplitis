create or replace function touches(_table_id varchar)
returns varchar[]
language plpgsql
as $$
begin

return (select array(select id
        from events
        where table_id = _table_id
        order by seq) as touches);

end;
$$;


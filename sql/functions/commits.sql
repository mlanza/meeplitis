create or replace function commits(_table_id varchar, _seat_id varchar)
returns varchar[]
language plpgsql
as $$
begin

return (select array(select id
        from events
        where table_id = _table_id
        and seat_id = _seat_id
        and type = 'committed'
        order by seq) as commits);

end;
$$;


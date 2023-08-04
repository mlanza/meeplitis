create or replace function last_move(_table_id varchar, _event_id varchar, _seat_id varchar)
returns varchar
language plpgsql
as $$
begin

return case when _seat_id is null then null else (select id
        from events
        where table_id = _table_id
        and seat_id = _seat_id
        and type = 'committed'
        and seq < (select seq from events where table_id = _table_id and id = _event_id limit 1)
        order by seq desc
        limit 1) end;

end;
$$;


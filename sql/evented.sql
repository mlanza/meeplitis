create or replace function evented(_table_id varchar)
returns jsonb
language plpgsql
as $$
begin

return (select coalesce(json_agg(json_build_object('id', id, 'type', type, 'details', details, 'seat', seat)), '[]'::json) as evented
  from (select e.id, e.type, e.details, s.seat
        from events e
        left join seats s on s.table_id = e.table_id and s.id = e.seat_id
        where e.table_id = _table_id
        order by e.seq) as e);

end;
$$;

create or replace function evented(_table_id varchar, _event_id varchar)
returns jsonb
language plpgsql
as $$
declare
_seq bigint;
begin

_seq := (select seq from events where table_id = _table_id and id = _event_id);

return (select coalesce(json_agg(json_build_object('id', id, 'type', type, 'details', details, 'seat', seat)), '[]'::json) as evented
  from (select e.id, e.type, e.details, s.seat
        from events e
        left join seats s on s.table_id = e.table_id and s.id = e.seat_id
        where e.table_id = _table_id
        and e.seq <= _seq
        order by e.seq) as e);

end;
$$;

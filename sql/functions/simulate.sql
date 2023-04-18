create or replace function simulate(_table_id varchar, _commands jsonb, _seat int) returns jsonb
security definer
set search_path = public
as $$
declare
_event_id varchar;
begin

select id
from events
where table_id = _table_id
order by seq desc
limit 1
into _event_id;

return simulate(_table_id, _event_id, _commands, _seat);

end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _event_id varchar, _commands jsonb, _seat int) returns jsonb
security definer
set search_path = public
as $$
declare
_fn text;
_result jsonb;
_seats int;
_events jsonb;
_config jsonb;
_seat_configs jsonb;
_from_seq bigint;
_to_seq bigint;
_snapshot jsonb;
_snapshot_seq bigint;
_snapshot_id varchar;
begin

select count(*)
from seats
where table_id = _table_id
into _seats;

select seq
from events
where table_id = _table_id
order by seq
limit 1
into _from_seq;

select seq
from events
where table_id = _table_id and id = _event_id
into _to_seq;

select e.seq, e.id, e.snapshot
from (
select s.snapshot, e.*
from events e
left join snapshots s on s.table_id = e.table_id and s.seq = e.seq
where e.table_id = _table_id and e.seq between _from_seq and _to_seq
order by e.seq desc offset 5) e
where snapshot is not null limit 1
into _snapshot_seq, _snapshot_id, _snapshot;

if _snapshot_seq is not null then
  _from_seq := _snapshot_seq + 1;
end if;

select coalesce(json_agg(json_build_object('id', id, 'type', type, 'details', details, 'seat', seat)), '[]'::json) as evented
from (select id, type, details, seat from moves where table_id = _table_id and seq between _from_seq and _to_seq order by seq) e into _events;

select config, fn
from tables
where id = _table_id
into _config, _fn;

select seat_configs(_table_id)
into _seat_configs;

raise log '$ simulating % @ %#% (from % to %), config %, events %, commands %, snapshot % -> %', _fn, _table_id, _event_id, _from_seq, _to_seq, _config, _events, _commands, _snapshot_id, _snapshot;

return (select case _fn
      when 'ohhell' then ohhell(_seat_configs, _config, _events, _commands, array[_seat], _snapshot)
      when 'mexica' then mexica(_seat_configs, _config, _events, _commands, array[_seat], _snapshot)
      else null end);

end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _event_id varchar, _seats int[]) returns jsonb
security definer
set search_path = public
as $$
declare
_fn text;
_result jsonb;
_events jsonb;
_config jsonb;
_seat_configs jsonb;
begin

select evented
from evented(_table_id, _event_id)
into _events;

select seat_configs(_table_id)
into _seat_configs;

select config, fn
from tables
where id = _table_id
into _config, _fn;

raise log '$ simulating %, config %, events %', _seats, _config, _events;

select case _fn
      when 'ohhell' then ohhell(_seat_configs, _config, _events, '[]'::jsonb, _seats, null)
      when 'mexica' then mexica(_seat_configs, _config, _events, '[]'::jsonb, _seats, null)
      else null end
into _result;

return _result;
end;
$$ language plpgsql;

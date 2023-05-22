create or replace function simulate(_table_id varchar, _event_id varchar, _commands jsonb, _seats int[]) returns jsonb
security definer
set search_path = public
as $$
declare
_fn text;
_result jsonb;
_events jsonb;
_config jsonb;
_seat_configs jsonb;
_payload jsonb;
_snapshot jsonb;
_from_event_id varchar;
_seen varchar;
begin

select config, fn
from tables
where id = _table_id
into _config, _fn;

select seat_configs(_table_id)
into _seat_configs;

select id
from events
where table_id = _table_id and snapshot is null and seq < (select seq from events where table_id = _table_id and id = _event_id)
order by seq
into _from_event_id;

select coalesce(_from_event_id, _event_id)
into _from_event_id;

select evented(_table_id, _from_event_id, _event_id)
into _events;

select snapshot->'state' --first previous available snapshot
from events
where table_id = _table_id and id = (
  select id
  from events
  where table_id = _table_id and seq < (
    select seq
    from events
    where table_id = _table_id and id = _from_event_id)
  order by seq desc
  limit 1)
into _snapshot;

select case when array_to_json(_seats)::varchar = array_to_json(array[null])::varchar then 'anon' else array_to_json(_seats)::varchar end into _seen;

raise log '$ simulate at % for % from event id % to % with %', _table_id, _seen, _from_event_id, _event_id, _snapshot;

select '{"game": "' || _fn || '", "seats": ' || _seat_configs::varchar || ', "config": ' || _config::varchar || ', "events": ' || _events::varchar || ', "commands": ' || _commands::varchar || ', "seen": ' || array_to_json(_seats) || ', "snapshot": ' || coalesce(_snapshot, 'null')::varchar || '}'
into _payload;

return (select simulate(_fn, _payload));

end;
$$ language plpgsql;

create or replace function simulate(_game varchar, _payload jsonb)
returns jsonb
security definer
set search_path = public,extensions
as $$
declare
_result jsonb;
_status int = 0;
_req varchar;
begin

select generate_uid(5)
into _req;

raise log '$ req/% % -> %', _game, _req, _payload;

select case _game
      when 'ohhell' then ohhell(_payload)
      when 'mexica' then mexica(_payload)
      else null end
into _result;
/*

SET statement_timeout = 10000;

select status, content
from http_post('https://yourmove.fly.dev/simulate/' || _game, _payload::varchar, 'application/json'::varchar)
into _status, _result;
*/
raise log '$ resp/% % % -> %', _game, _req, _status, _result;

if _result is null or _status > 222 then
  raise exception 'Unable to retrieve snapshot for % event %', _table_id, _event_id using hint = 'Check remote server for issues';
end if;

return _result;

end;
$$ language plpgsql;

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
begin

return (select simulate(_table_id, _event_id, _commands, array[_seat]));

end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _event_id varchar, _seats int[]) returns jsonb
security definer
set search_path = public
as $$
begin

return (select simulate(_table_id, _event_id, '[]'::jsonb, _seats));

end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _event_id varchar) returns jsonb
security definer
set search_path = public
as $$
declare
_seats int[];
begin

select array_agg(seat)
from seats
where table_id = _table_id
into _seats;

return (select simulate(_table_id, _event_id, '[]'::jsonb, _seats));

end;
$$ language plpgsql;

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
set search_path = public,extensions
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
set search_path = public,extensions
as $$
declare
_fn text;
_result jsonb;
_seats int;
_events jsonb;
_config jsonb;
_seat_configs jsonb;
_payload jsonb;
_snapshot jsonb;
_seen int[];
begin

select config, fn, array[_seat]
from tables
where id = _table_id
into _config, _fn, _seen;

select count(*)
from seats
where table_id = _table_id
into _seats;

select seat_configs(_table_id)
into _seat_configs;

/*
select evented
from evented(_table_id, _event_id)
into _events;
*/

select '[]' into _events;

select snapshot
from events
where table_id = _table_id and id = _event_id
into _snapshot;

select '{"game": ' || _fn || ', "seats": ' || _seat_configs::varchar || ', "config": ' || _config::varchar || ', "events": ' || _events::varchar || ', "commands": ' || array_to_json(_commands)::varchar || ', "seen": ' || array_to_json(_seen) || ', "snapshot": ' || coalesce(_snapshot, 'null')::varchar || '}'
into _payload;

return (select simulate(_fn, _payload));

end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _event_id varchar, _seats int[]) returns jsonb
security definer
set search_path = public,extensions
as $$
declare
_fn text;
_result jsonb;
_config jsonb;
_events jsonb;
_payload jsonb;
_snapshot jsonb;
_seat_configs jsonb;
begin

select seat_configs(_table_id)
into _seat_configs;

/*
select evented
from evented(_table_id, _event_id)
into _events;
*/

select '[]' into _events;

select snapshot
from events
where table_id = _table_id and id = _event_id
into _snapshot;

select config, fn
from tables
where id = _table_id
into _config, _fn;

select '{"game": "' || _fn::varchar || '", "seats": ' || _seat_configs::varchar || ', "config": ' || _config::varchar || ', "events": ' || _events::varchar || ', "commands": [], "seen": ' || array_to_json(_seats)::varchar || ', "snapshot": ' || coalesce(_snapshot, 'null')::varchar || '}'
into _payload;

raise log '$ payload -> %', _payload;

return (select simulate(_fn, _payload));

end;
$$ language plpgsql;

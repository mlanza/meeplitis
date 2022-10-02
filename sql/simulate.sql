create or replace function simulate(_table_id varchar, _commands jsonb, _seat int) returns jsonb
security definer
set search_path = public
as $$
declare
_fn text;
_result jsonb;
_seats int;
_events jsonb;
_config jsonb;
_sql text;
begin

select count(*)
from seats
where table_id = _table_id
into _seats;

select evented
from evented(_table_id)
into _events;

select config
from tables
where id = _table_id
into _config;

select fn
from tables
where id = _table_id
into _fn;

raise log '$ simulating %, config %, events %, commands %', _seats, _config, _events, _commands;

select case _fn when 'ohhell' then ohhell(_seats, _config, _events, _commands, array[_seat]) else null end into _result;

return _result;
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
_sql text;
begin

select count(*)
from seats
where table_id = _table_id
into _seats;

select evented
from evented(_table_id, _event_id)
into _events;

select config
from tables
where id = _table_id
into _config;

select fn
from tables
where id = _table_id
into _fn;

raise log '$ simulating %, config %, events %, commands %', _seats, _config, _events, _commands;

select case _fn when 'ohhell' then ohhell(_seats, _config, _events, _commands, array[_seat]) else null end into _result;

return _result;
end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _event_id varchar, _commands jsonb, _seen jsonb) returns jsonb
security definer
set search_path = public
as $$
declare
_fn text;
_slug text;
_result jsonb;
_events jsonb;
_config jsonb;
_seat_configs jsonb;
_payload jsonb;
_snapshot jsonb;
_snapshot_event_id varchar;
_from_event_id varchar;
begin

raise log '$ simulate! %#%, commands %, seen %', _table_id, _event_id, _commands, _seen;

select t.config, g.slug, replace(g.slug,'-','') || '_' || t.release
from tables t
join games g on g.id = t.game_id
where t.id = _table_id
into _config, _slug, _fn;

select seat_configs(_table_id)
into _seat_configs;

select id, seq
from (
  (select id, seq
    from events
    where table_id = _table_id
    and seq > (
      select seq
      from events
      where table_id = _table_id and snapshot is not null and seq < (select seq from events where table_id = _table_id and id = _event_id)
      order by seq desc limit 1)
    limit 1)
  union
  (select id, seq
    from events
    where table_id = _table_id
    order by seq
    limit 1)
) x
order by seq desc limit 1
into _from_event_id;

select evented(_table_id, _from_event_id, _event_id)
into _events;

select id, snapshot->'state' --first previous available snapshot
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
into _snapshot_event_id, _snapshot;

raise log '$ simulate at % for % from event id % to % with snapshot at % -> %', _table_id, case when _seen = '[null]'::jsonb then 'anon' else _seen::varchar end, _from_event_id, _event_id, _snapshot_event_id, _snapshot;

select '{"game": "' || _slug || '", "fn": "' || _fn || '", "seats": ' || _seat_configs::varchar || ', "config": ' || _config::varchar || ', "events": ' || _events::varchar || ', "commands": ' || _commands::varchar || ', "seen": ' || _seen || ', "snapshot": ' || coalesce(_snapshot, 'null')::varchar || '}'
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
_req varchar;
begin

select generate_uid(5)
into _req;

raise log '$ simulate %:% in -> %', _game, _req, _payload;

select simulate_local(_game, _payload)
into _result;

raise log '$ simulate %:% out -> %', _game, _req, _result;

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

return (select simulate(_table_id, _event_id, _commands, array_to_json(array[_seat])::jsonb));

end;
$$ language plpgsql;

create or replace function simulate(_table_id varchar, _event_id varchar, _seats jsonb) returns jsonb
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
_seats jsonb;
begin

select to_jsonb(array_agg(seat))
from seats
where table_id = _table_id
into _seats;

return (select simulate(_table_id, _event_id, _seats));

end;
$$ language plpgsql;

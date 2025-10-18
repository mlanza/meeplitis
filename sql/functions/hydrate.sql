create or replace function hydrate(_table_id varchar, _event_id varchar, _commands jsonb, _seen jsonb)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  _fn text;
  _slug text;
  _release text;
  _req varchar;
  _config jsonb;
  _seated jsonb;

  _evt jsonb;
  _event jsonb;
  _events jsonb;
  _snapshot jsonb;
  _snapshot_id varchar;
begin
  select generate_uid(5) into _req;

  select t.config, g.slug, replace(g.slug,'-','') || '_' || t.release, t.release
    into _config, _slug, _fn, _release
  from tables t
  join games g on g.id = t.game_id
  where t.id = _table_id;

  select seated(_table_id) into _seated;

  -- pull snapshot + events via eventable
  select eventable(_table_id, _event_id) into _evt;

  _snapshot_id := _evt->>'snapshot_id';
  _snapshot    := _evt->'snapshot';
  _events      := _evt->'events';
  _event       := _evt->'event';

  return jsonb_build_object(
    'slug',        _slug,
    'release',     _release,
    'req',         _req,
    'seats',       _seated,
    'config',      _config,
    'events',      _events,
    'commands',    _commands,
    'seen',        _seen,
    'event',       _event,
    'snapshot_id', _snapshot_id,
    'snapshot',    _snapshot
  );
end;
$$;

create or replace function hydrate(_table_id varchar, _event_id varchar, _commands jsonb, _seat int) returns jsonb
security definer
set search_path = public
as $$
begin
  return hydrate(_table_id, _event_id, _commands, array_to_json(array[_seat])::jsonb);
end;
$$ language plpgsql;

create or replace function hydrate(_table_id varchar, _event_id varchar, _seats jsonb) returns jsonb
security definer
set search_path = public
as $$
begin
  return hydrate(_table_id, _event_id, '[]'::jsonb, _seats);
end;
$$ language plpgsql;

create or replace function hydrate(_table_id varchar, _event_id varchar) returns jsonb
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

  return hydrate(_table_id, _event_id, _seats);
end;
$$ language plpgsql;

create or replace function hydrate(_table_id varchar, _commands jsonb, _seat int) returns jsonb
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

  return hydrate(_table_id, _event_id, _commands, _seat);
end;
$$ language plpgsql;

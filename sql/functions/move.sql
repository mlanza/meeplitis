create or replace function move(_table_id varchar, _commands jsonb)
returns table(id varchar, table_id varchar, type varchar, seat_id varchar)
security definer
set search_path = public, pgmq
language plpgsql
as $$
declare
_seat int;
begin

select seat as seats
from seats s
where s.table_id = _table_id
and player_id = auth.uid()
into _seat;

return query (select move(_table_id, commands, _seat));
end;
$$;

create or replace function move(_table_id varchar, _commands jsonb, _seat int)
returns table(id varchar, table_id varchar, type varchar, seat_id varchar)
security definer
set search_path = public, pgmq
language plpgsql
as $$
declare
  _count int;
  _recipients int;
  _simulated jsonb;
  _up smallint[];
  _status table_status;
  _slug text;
  _title varchar;
  _thumbnail_url varchar;
begin

if _seat is null then
  raise exception 'only players may issue moves';
end if;

select t.status
from tables t
where t.id = _table_id
into _status;

if _status <> 'started' then
  raise exception 'can only issues moves at active tables';
end if;

select count(*)
from jsonb_array_elements_text(_commands)
into _count;

if _count = 0 then
  raise exception 'must provide command(s)';
end if;

raise log '$ seat % at table `%` moves issuing % command(s): %', _seat, _table_id, _count, _commands;

_simulated := (select simulate(_table_id, _commands, _seat));
_up := (select array_agg(value::smallint)::smallint[] from jsonb_array_elements(_simulated->'up'));

update tables
set up = _up
where tables.id = _table_id;

update profiles p
set last_moved_at = now()
from seats s
where p.id = s.player_id and s.table_id = _table_id and s.seat = _seat;

select jsonb_array_length((_simulated->'notify')::jsonb)
into _recipients;

if _recipients > 0 then
  select array(
    select cast(value AS smallint)
    from jsonb_array_elements_text(_simulated->'notify'))
  into _up;

  select
      g.title,
      g.slug,
      g.thumbnail_url
  from tables t
  join games g on g.id = t.game_id
  where t.id = _table_id
  into _title, _slug, _thumbnail_url;

  perform pgmq.send(
    'notifications',
    jsonb_build_object(
      'type', 'up',
      'table_id', _table_id,
      'title', _title,
      'slug', _slug,
      'thumbnail_url', _thumbnail_url,
      'recipients', emails(_table_id, _up),
      'prompts', (_simulated->'prompts'),
      'seats', _up
    ),
    0
  );

  perform net.http_post(
    url => 'https://miwfiwpgvfhggfnqtfso.supabase.co/functions/v1/notify-consumer',
    headers => jsonb_build_object(
      'authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'SUPABASE_SERVICE_ROLE_KEY' limit 1
      ),
      'content-type',  'application/json',
      'x-wake-secret', (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'WAKE_SECRET' limit 1
      )
    ),
    body => '{}'::jsonb
  );

end if;

return query
insert into events (table_id, type, details, undoable, seat_id, snapshot)
select _table_id, e.type, e.details, e.undoable, s.id as seat_id, e.snapshot
from addable_events(_simulated->'added') e
left join seats s on s.table_id = _table_id and s.seat = e.seat
returning events.id, events.table_id, events.type, events.seat_id;
end;
$$;

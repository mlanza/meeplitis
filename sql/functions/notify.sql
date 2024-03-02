create or replace function notify(_seq bigint, _retry boolean default false)
returns jsonb
set search_path = public,extensions
security definer
language plpgsql
as $$
declare
  _status int = 401; -- no recipients
  _completed boolean;
  _type varchar;
  _title varchar;
  _slug varchar;
  _table_id varchar;
  _payload varchar;
  _recipients jsonb;
  _outcome jsonb;
  _response jsonb = null;
  _content json = null;
begin

  select type, title, slug, table_id, recipients, outcome, completed
  from notices
  where seq = _seq
  into _type, _title, _slug, _table_id, _recipients, _outcome, _completed;

  if _recipients is not null and (_retry or not _completed) then
    select '{"type": "' || _type || '", "title": "' || _title || '", "slug": "' || _slug || '", "table_id": "' || _table_id || '" ,"outcome": ' || coalesce(_outcome, 'null') || ' ,"recipients": ' || _recipients || '}' as payload
    into _payload;

    raise log '$ notify % -> %', _seq, _payload;

    select status, content
    from http_post('https://notify.workers.yourmove.cc', _payload, 'application/json')
    into _status, _content;

    select ('{"status": ' || _status::varchar || ', "content": ' || _content || '}')::jsonb
    into _response;

    raise log '$ notified % <- (%) %', _seq, _status, _response;

    update notifications
    set completed = (_status = 200),
        response = _response,
        executed_at = now(),
        tries = tries + 1
    where seq = _seq;

    return _response;
  else
    return null;
  end if;
end;
$$;

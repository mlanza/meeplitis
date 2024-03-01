create or replace function notify(_seq bigint, _retry boolean default false)
returns jsonb
set search_path = public,extensions
security definer
language plpgsql
as $$
declare
  _status int = 401; -- no recipients
  _job_status job_status;
  _details jsonb;
  _type varchar;
  _title varchar;
  _slug varchar;
  _table_id varchar;
  _recipients jsonb;
  _outcome jsonb;
  _response jsonb = null;
  _content json = null;
begin

  raise log '$ notifying';

  select type, title, slug, table_id, recipients, outcome, status, details
  from notices
  where seq = _seq
  into _type, _title, _slug, _table_id, _recipients, _outcome, _job_status, _details;

  raise log '$ notifying % % -> %', _type, _seq, _details;

  if _retry or _job_status in ('pending'::job_status, 'failed'::job_status) then

    raise log '$ notify type %, title %, slug %, table_id %, outcome %, recipients %', _type, _title, _slug, _table_id, _outcome, _recipients;

    if _recipients is not null then

      select status, content
      from http_post('https://notify.workers.yourmove.cc',
                    '{"type": "' || _type || '", "title": "' || _title || '", "slug": "' || _slug || '", "table_id": "' || _table_id || '" ,"outcome": ' || coalesce(_outcome, 'null') || ' ,"recipients": ' || _recipients || '}', 'application/json')
      into _status, _content;

    end if;

    select ('{"status": ' || _status::varchar || ', "recipients": ' || _recipients::varchar || ', "content": ' || _content || '}')::jsonb
    into _response;

    raise log '$ notified % -> %', _status, _response;

    update jobs
    set status = (case _status when 200 then 'succeeded' else 'failed' end)::job_status,
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

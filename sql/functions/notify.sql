create or replace function notify(_seq bigint)
returns json
set search_path = public,extensions
security definer
language plpgsql
as $$
declare
  _status int;
  _job_status job_status;
  _type varchar;
  _title varchar;
  _slug varchar;
  _table_id varchar;
  _recipients jsonb;
  _outcome jsonb;
  _content json;
begin

  raise log '$ notifying';

  select type, title, slug, table_id, recipients, outcome, status
  from notices
  where seq = _seq
  into _type, _title, _slug, _table_id, _recipients, _outcome, _job_status;

  if _job_status in ('pending'::job_status, 'failed'::job_status) then

    raise log '$ notify type %, title %, slug %, table_id %, outcome %, recipients %', _type, _title, _slug, _table_id, _outcome, _recipients;

    select status, content
    from http_post('https://notify.workers.yourmove.cc',
                  '{"type": "' || _type || '", "title": "' || _title || '", "slug": "' || _slug || '", "table_id": "' || _table_id || '" ,"outcome": ' || coalesce(_outcome, 'null') || ' ,"recipients": ' || _recipients || '}', 'application/json')
    into _status, _content;

    update jobs
    set status = (case _status when 200 then 'succeeded' else 'failed' end)::job_status,
        executed_at = now(),
        tries = tries + 1
    where seq = _seq;

    raise log '$ notified %', _status;

    return ('{"status": ' || _status::varchar || ', "recipients": ' || _recipients::varchar || ', "content": ' || _content || '}')::json;

  else

    return null;

  end if;
end;
$$;

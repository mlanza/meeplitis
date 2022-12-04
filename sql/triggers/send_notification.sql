create or replace function send_notification() returns trigger
AS $$
begin

  raise log '$ job added `%`', new.seq;

  perform notify(new.seq);

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_notification_job_added on jobs;

create trigger on_notification_job_added
after insert on jobs for each row when (new.type in ('up:notice', 'started:notice', 'finished:notice'))
execute function send_notification();

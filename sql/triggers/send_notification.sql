create or replace function send_notification() returns trigger
AS $$
begin

  raise log '$ notification added `%`', new.seq;

  perform notify(new.seq);

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_notification_added on notification;

create trigger on_notification_added
after insert on notifications for each row
execute function send_notification();

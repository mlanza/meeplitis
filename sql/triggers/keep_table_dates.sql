create or replace function keep_table_dates() returns trigger
as $$
declare
  _completed boolean;
  _type varchar;
  _title varchar;
  _slug varchar;
  _thumbnail_url varchar;
begin

  if (new.status = 'started'::table_status and old.status <> 'started'::table_status) then
    update tables
    set started_at = now(),
        touched_at = now()
    where id = new.id;
  end if;

  if (new.status = 'finished'::table_status and old.status <> 'finished'::table_status) then
    update tables
    set finished_at = now(),
        touched_at = now()
    where id = new.id;

    select
        g.title,
        g.slug,
        g.thumbnail_url
    from tables t
    join games g on g.id = t.game_id
    where t.id = new.id
    into _title, _slug, _thumbnail_url;

    perform pgmq.send('notifications',
      jsonb_build_object(
        'type', 'finished',
        'table_id', new.id,
        'outcome', outcome(new.id),
        'title', _title,
        'slug', _slug,
        'thumbnail_url', _thumbnail_url,
        'recipients', emails(new.id, null)
      ),
      0
    );
  end if;

  perform pgmq.wake_notify_consumer();

  return new;

end;
$$ language plpgsql;

drop trigger if exists on_table_changed on tables;

create trigger on_table_changed
after update on tables for each row when (pg_trigger_depth() = 0)
execute function keep_table_dates();

create or replace function prune_notifications()
  returns void
  security definer
  set search_path = public
  language plpgsql
as $$
begin

  delete from notifications where table_id in (
    select id
    from tables where status = 'finished' and exists(select 1 from notifications where table_id = tables.id));

end;
$$;

create or replace function prune_jobs()
  returns int
  security definer
  set search_path = public
  language plpgsql
as $$
declare
  _count int := 0;
begin

  with deletions as (
    delete from jobs
    where created_at < now() - interval '30 days'
    and status = 'succeeded'
    returning *
  )

  select count(*)
  from deletions
  into _count;

  raise log '$ pruned jobs of % rows', _count;

  return _count;

end;
$$;

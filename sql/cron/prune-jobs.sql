select cron.schedule (
  'prune-jobs',
  '0 5 * * 6', -- saturday, 5:00am
  $$ select prune_jobs() $$
);

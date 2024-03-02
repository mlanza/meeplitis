select cron.schedule (
  'prune-notifications',
  '0 2 * * 6', -- saturday, 2:00am
  $$ select prune_notifications() $$
);

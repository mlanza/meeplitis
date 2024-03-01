select cron.schedule (
  'abandon-stale-tables',
  '0 3 * * *',
  $$ select abandons() $$
);

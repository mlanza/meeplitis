select cron.schedule (
  'delete-vacants',
  '0 3 * * *',
  $$ delete from tables where status = 'vacant' $$
);

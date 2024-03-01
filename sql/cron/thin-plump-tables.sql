select cron.schedule (
  'thin-plump-tables',
  '0 4 * * 6', -- saturday, 4:00am
  $$ select thins() $$
);

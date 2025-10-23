create or replace function pgmq.consume_notifications()
returns void
security definer
set search_path = pgmq, public
language plpgsql
as $$
declare
  _url text := 'https://miwfiwpgvfhggfnqtfso.supabase.co/functions/v1/consume-notifications';
  _auth text;
  _wake text;
begin
  -- pull secrets as the definer; schema-qualify everything
  select decrypted_secret
  into _auth
  from vault.decrypted_secrets
  where name = 'SUPABASE_SERVICE_ROLE_KEY'
  limit 1;

  select decrypted_secret
  into _wake
  from vault.decrypted_secrets
  where name = 'WAKE_SECRET'
  limit 1;

  -- keep failures from aborting the whole move()
  begin
    perform net.http_post(
      url     => _url,
      headers => jsonb_build_object(
        'authorization', 'Bearer ' || _auth,
        'content-type',  'application/json',
        'x-wake-secret', _wake
      ),
      body    => '{}'::jsonb
    );
  exception when others then
    -- log and keep going; adjust severity as you like
    raise log 'consume-notifications wake up failed: %', sqlerrm;
  end;
end;
$$;

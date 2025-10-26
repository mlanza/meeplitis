psql "postgresql://postgres:$SUPABASE_DB_PWD@db.$MEEPLITIS_PROJECT_REF.supabase.co:5432/postgres?sslmode=verify-full&sslrootcert=$HOME/meeplitis.crt" \
  -X -q -tA -c "SELECT json_agg(t) FROM ( $@ ) t;" | jq .

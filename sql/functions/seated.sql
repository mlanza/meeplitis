create or replace function seated(_table_id varchar)
returns jsonb
security definer
language sql
as $$
  with base as (
    select
      s.player_id,
      p.username,
      s.id as seat_id,
      p.avatar_url,
      p.delegate_id,
      s.seat,
      case
        when s.config is null then '{}'::jsonb
        when jsonb_typeof(s.config::jsonb) = 'object' then s.config::jsonb
        else '{}'::jsonb
      end as cfg
    from seats s
    join profiles p on p.id = s.player_id
    join auth.users u on u.id = s.player_id
    where s.table_id = _table_id
    order by s.seat
  )
  select coalesce(
    jsonb_agg(
      cfg
      || jsonb_build_object(
           'player_id', player_id,
           'username', username,
           'seat_id', seat_id,
           'avatar_url', avatar_url,
           'delegate_id', delegate_id
         )
      order by seat
    ),
    '[]'::jsonb
  )
  from base;
$$;

drop function if exists seat_configs(varchar);

create or replace function seat_configs(_table_id varchar)
returns jsonb
language plpgsql
as $$
begin
  return (
    select jsonb_agg(x.item)
    from (
      select
        coalesce(s.config::jsonb, '{}'::jsonb)
        || jsonb_build_object('delegate_id', p.delegate_id) as item
      from seats s
      left join profiles p on p.id = s.player_id
      where s.table_id = _table_id
      order by s.seat
    ) as x
  );
end;
$$;

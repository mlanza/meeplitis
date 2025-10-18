-- heavy-lift: cutoff to a specific event
create or replace function eventable(_table_id varchar, _event_id varchar)
returns jsonb
language sql
as $$
with cutoff as (
  select seq as cutoff_seq
  from events
  where table_id = _table_id and id = _event_id
),
snap as (
  select e.id as snapshot_id, e.snapshot, e.seq as snapshot_seq
  from events e
  join cutoff c on true
  where e.table_id = _table_id
    and e.seq <= c.cutoff_seq
    and e.snapshot is not null
  order by e.seq desc
  limit 1
),
bounds as (
  select
    c.cutoff_seq,
    s.snapshot_id,
    s.snapshot,
    s.snapshot_seq
  from cutoff c
  left join snap s on true
)
select jsonb_build_object(
  'snapshot_id', b.snapshot_id,
  'snapshot',    b.snapshot,
  'events',
    coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', e.id,
                 'type', e.type,
                 'details', e.details,
                 'seat', st.seat
               )
               order by e.seq
             )
      from events e
      left join seats st
        on st.table_id = e.table_id
       and st.id = e.seat_id
      where e.table_id = _table_id
        and e.seq > coalesce(b.snapshot_seq, 0)
        and e.seq <= b.cutoff_seq
    ), '[]'::jsonb),
  'event',
    (
      select jsonb_build_object(
               'id', e.id,
               'type', e.type,
               'details', e.details,
               'seat', st.seat
             )
      from events e
      left join seats st
        on st.table_id = e.table_id
       and st.id = e.seat_id
      where e.table_id = _table_id
        and e.id = _event_id
    )
)
from bounds b;
$$;

-- convenience: "to date" version delegates to the 2-arg
create or replace function eventable(_table_id varchar)
returns jsonb
language plpgsql
as $$
declare
  _latest_event_id varchar;
begin
  select id
    into _latest_event_id
  from events
  where table_id = _table_id
  order by seq desc
  limit 1;

  if _latest_event_id is null then
    -- no events at all
    return jsonb_build_object(
      'snapshot_id', null,
      'snapshot',    null,
      'events',      '[]'::jsonb,
      'event',       null
    );
  end if;

  return eventable(_table_id, _latest_event_id);
end;
$$;

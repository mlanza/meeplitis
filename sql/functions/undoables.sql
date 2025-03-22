create or replace function undoables(_table_id varchar)
returns jsonb
language plpgsql
as $$
declare
begin

return (WITH
last_actor AS (
  SELECT seq, seat_id
  FROM events
  WHERE table_id = _table_id
  AND seat_id IS NOT NULL
  ORDER BY seq DESC
  LIMIT 1),
first_other AS (
  SELECT *
  FROM events
  WHERE table_id = _table_id
  AND seat_id IS NOT NULL AND seat_id <> (SELECT seat_id FROM last_actor)
  ORDER BY seq DESC
  LIMIT 1),
last_fixed AS (
  SELECT seq
  FROM events
  WHERE table_id = _table_id
  AND undoable = false
  ORDER BY seq DESC
  LIMIT 1),
seq_cutoff AS (
  SELECT GREATEST(
    COALESCE((SELECT seq FROM first_other), 0),
    COALESCE((SELECT seq FROM last_fixed), 0),
    0
  ) AS cutoff
),
actions AS (
  SELECT *,
         case when undoable IS NULL THEN (select undoable FROM events WHERE table_id = _table_id and undoable is not null and seq < e.seq ORDER BY seq DESC LIMIT 1) else undoable end AS effective_undoable,
         case when undoable IS NULL THEN (select id FROM events WHERE table_id = _table_id and undoable is not null and seq < e.seq ORDER BY seq DESC LIMIT 1) else id end as effective_id
  FROM events e
  WHERE table_id = _table_id
  AND seq > (SELECT cutoff FROM seq_cutoff)
  ORDER BY seq desc),
undoables AS (
  SELECT *
  FROM actions
  WHERE effective_undoable = true),
dependencies AS (
  SELECT effective_id, array_agg(id) AS ids FROM undoables group by effective_id
)
SELECT json_object_agg(effective_id, ids) AS result  FROM dependencies);

--SELECT json_build_object('seat_id', (SELECT seat_id FROM seated), 'undoable', json_object_agg(effective_id, ids)) AS result FROM dependencies);

end;
$$;

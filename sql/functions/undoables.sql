create or replace function undoables(_table_id varchar)
returns varchar[]
language plpgsql
as $$
declare
begin

return (select array(
  WITH cutoff AS (
      SELECT undoable
      FROM events
      WHERE table_id = _table_id
        AND undoable is not null
      ORDER BY seq DESC
      LIMIT 1
  ),
  feasible AS (
      SELECT seq
      FROM events
      WHERE table_id = _table_id
        AND undoable = false
      ORDER BY seq DESC
      LIMIT 1)
  SELECT id
  FROM (
    SELECT id, type, seq, coalesce(undoable, (select undoable from cutoff)) as undoable FROM events as e
    WHERE table_id = _table_id
      AND seq > (SELECT seq FROM feasible)) AS evts
  WHERE evts.undoable = true
  ORDER BY evts.seq) AS undoables);

end;
$$;


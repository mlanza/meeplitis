create or replace function perspective(_table_id varchar, _seat int default null) returns jsonb as $$
begin

return (select simulate(_table_id, '[]'::jsonb, _seat));

end;
$$ language plpgsql;

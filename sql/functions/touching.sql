create or replace function touching(_table_id varchar)
returns jsonb
security definer
language plpgsql
as $$
begin

return (select json_build_object('touches', touches(_table_id), 'undoables', undoables(_table_id), 'last_acting_seat', last_acting_seat(_table_id)));
end; $$

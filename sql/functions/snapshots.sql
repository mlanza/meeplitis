ALTER TABLE events ADD CONSTRAINT uniq_event_table_seq UNIQUE (table_id, seq);

CREATE TABLE snapshots(
    table_id varchar(11) not null,
    seq bigserial not null,
    snapshot jsonb not null,
    created_at timestamp not null default now(),
    CONSTRAINT fk_event_snapshots
      FOREIGN KEY(table_id, seq)
	    REFERENCES events(table_id, seq) ON DELETE CASCADE,
    PRIMARY KEY (table_id, seq));

ALTER TABLE snapshots ADD CONSTRAINT uniq_snapshot_table_seq UNIQUE (table_id, seq);

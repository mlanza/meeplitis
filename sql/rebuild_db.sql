-- TODO define indexes
-- TODO define proc for committing move

ALTER TABLE tables DROP CONSTRAINT fk_last_touch;
DROP TABLE events;
DROP TABLE seats;
DROP TABLE tables;
DROP TABLE games;

DROP TYPE table_status;
DROP TYPE seating_mode;

CREATE TYPE table_status AS ENUM ('open', 'vacant', 'full', 'started', 'locked', 'finished', 'abandoned');
-- open - players may freely join and leave
-- vacant - all players vacated before the game started
-- full - the full complement of players are seated, the game will start momentarily
-- started - the game is ready for moves (occurs once `start` event is added)
-- locked - rare admin action perhaps to resolve a concern
-- finished - the game has concluded
-- abandoned - the game was not concluded before time ran out

CREATE TYPE seating_mode AS ENUM ('random', 'joined', 'picked');

CREATE TABLE games (
    id varchar(4) not null default generate_uid(4) primary key,
    title text not null,
    slug varchar(30) not null,
    fn varchar(30) not null, -- name of versioned function
    seats int2[] not null,
    thumbnail_url varchar,
    created_at timestamp not null default now());

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone."
  ON games FOR SELECT USING (true);

CREATE TABLE tables (
    id varchar(11) default generate_uid(11) not null primary key,
    game_id varchar(4) references games(id) not null,
    fn varchar(30) not null, -- name of versioned function
    seating seating_mode default 'random',
    config jsonb, -- configure this play
    admins uuid[], -- users capable of editing during/after play
    up smallint[], -- seats required to take action
    scored boolean default true,
    seating_change_at timestamp,
    started_at timestamp, -- used to delay start as in a tournament
    last_touch_id varchar(5), -- last event touching game state
    finished_at timestamp,
    keypass varchar, -- for restricting access, hashed
    status table_status not null default 'open',
    shredded_at timestamp, -- replayable history was discarded; happens sometime after finished/abandoned
    created_by uuid references auth.users(id) not null default auth.uid(), -- this person can update before starting
    created_at timestamp not null default now(),
    updated_at timestamp);

--ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables REPLICA IDENTITY FULL;

CREATE INDEX idx_tables_game_status ON tables (game_id, status);

--CREATE POLICY "tables are viewable by everyone."  ON tables FOR ALL USING (true);

CREATE TABLE seats (
    table_id varchar(11) references tables(id) not null,
    id varchar(3) not null default generate_uid(4),
    config jsonb, -- player specific configuration
    player_id uuid references auth.users(id),
    score float,
    adjustment float, -- from handicap, bid for seating order, penalties
    effective_score float,
    place smallint, -- final placement upon completion of game
    tie boolean,
    seat smallint, -- must be provide once game starts
    joined_at timestamp,
    created_at timestamp default now(),
    updated_at timestamp,
    PRIMARY KEY (table_id, id),
    UNIQUE (table_id, seat), -- seats are ordered beginning with 0 once game starts
    UNIQUE (table_id, player_id)); -- player can only occupy one seat

ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seats are viewable by everyone."
  ON seats FOR SELECT USING (true);

CREATE TABLE events(
    table_id varchar(11) references tables(id) not null,
    id varchar(5) not null default generate_uid(5),
    seq bigserial not null, -- guarantees order
    seat_id varchar(3),
    type varchar(15) not null,
    details jsonb,
    created_at timestamp not null default now(),
    CONSTRAINT fk_events_seats
      FOREIGN KEY(table_id, seat_id)
	  REFERENCES seats(table_id, id),
    PRIMARY KEY (table_id, id));

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

ALTER TABLE tables
ADD CONSTRAINT fk_last_touch
FOREIGN KEY (id, last_touch_id)
REFERENCES events(table_id, id);

CREATE TYPE job_status AS ENUM ('pending', 'succeeded', 'failed', 'deferred');
CREATE TYPE job_type AS ENUM ('started:notice', 'up:notice', 'finished:notice');

CREATE TABLE jobs (
    seq bigserial not null primary key,
    type job_type not null,
    details jsonb,
    status job_status not null default 'pending',
    created_at timestamp not null default now(),
    expires_at timestamp,
    executed_at timestamp,
    tries smallint default 0);

CREATE INDEX idx_jobs_status ON jobs (status, seq);

INSERT INTO games (id, title, slug, seats)
    VALUES ('8Mj1', 'Oh Hell (Blackout)', 'oh-hell', array[2, 3, 4, 5, 6, 7]);

DO $$
DECLARE
    _table_id varchar;
BEGIN
    select open_table('8Mj1', '{}'::jsonb, 4::smallint, '5e6b12f5-f24c-4fd3-8812-f537778dc5c2'::uuid) into _table_id;
    perform join_table(_table_id, 'c8619345-0c1a-44c4-bdfe-e6e1de11c6bd'::uuid);
    perform join_table(_table_id, '4c2e10da-a868-4098-aa0d-030644b4e4d7'::uuid);
    perform join_table(_table_id, '8cb76dc4-4338-42d4-a324-b61fcb889bd1'::uuid);

END $$;

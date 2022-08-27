-- TODO define indexes
-- TODO define proc for committing move

DROP TABLE moves;
DROP TABLE seats;
DROP TABLE starts;
DROP TABLE tables;
DROP TABLE games;

DROP TYPE move_status;
DROP TYPE table_status;
DROP TYPE seating_mode;

CREATE TYPE table_status AS ENUM ('open', 'closed', 'started', 'finished', 'abandoned');
-- open - players may freely take a seat or withdraw
-- closed - the players are fixed and ready to start (in immediate games closed instantly becomes started)
-- started - the game is ready for moves
-- finished - the game has concluded
-- abandoned - the game was not concluded before time ran out

CREATE TYPE event_status AS ENUM ('tentative', 'readied', 'confirmed', 'reversed', 'redacted'); -- redacted is an action for admins (e.g. GM)
-- tentative - contemplating move
-- readied - only used in simultaneous action selection games, can be reversed while not everyone is ready
-- confirmed - the move was executed
-- reversed - the move was momentarily undone
-- redacted - an admin in rare instances may back out several recent moves to allow minor fixes

CREATE TYPE seating_mode AS ENUM ('random', 'fixed', 'choice', 'bid');

CREATE TABLE games (
    id varchar(4) not null default generate_uid(4) primary key,
    title text not null,
    slug text,
    created_at timestamp not null default now());

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone."
  ON games FOR SELECT USING (true);

CREATE TABLE tables (
    id varchar(11) default generate_uid(11) not null primary key,
    game_id varchar(4) references games(id) not null,
    seating seating_mode default 'random',
    admins uuid [], -- users capable of editing during/after play
    started_at timestamp, -- used to delay start as in a tournament
    last_confirmed_move varchar(5),
    last_touched_at timestamp, -- when was the last time a player interacted with the game?
    touches int default 0, -- bumped every time a player interacts with the game
    finished_at timestamp,
    keypass varchar, -- for restricting access, hashed
    settings jsonb default '{}', -- configure this play
    status table_status not null default 'open',
    archived boolean default false, -- drops replability content to conserve space
    created_by uuid references auth.users(id) not null, -- this person can update before starting
    created_at timestamp not null default now(),
    updated_at timestamp);

--ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables REPLICA IDENTITY FULL;

--CREATE POLICY "tables are viewable by everyone."  ON tables FOR ALL USING (true);

CREATE TABLE seats (
    table_id varchar(11) references tables(id) not null,
    id varchar(3) not null default generate_uid(4),
    settings jsonb, -- player specific settings
    player_id uuid references auth.users(id),
    score float,
    place smallint, -- final placement upon completion of game
    tie boolean,
    up boolean default false,
    /* bid float, -- bid to get seat, if seating mode is `bid` */
    seq smallint, -- must be provide once game starts
    created_at timestamp default now(),
    updated_at timestamp,
    PRIMARY KEY (table_id, id),
    UNIQUE (table_id, seq),
    UNIQUE (table_id, player_id)); -- player can only occupy one seat

ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seats are viewable by everyone."
  ON seats FOR SELECT USING (true);

CREATE TABLE events(
    table_id varchar(11) references tables(id) not null,
    id varchar(5) not null default generate_uid(5),
    seq bigserial not null, -- guarantees move order
    seat_id varchar(3),
    event varchar(15) not null, -- determines whether move and prior moves are automatically commited or not
    details jsonb not null,
    status event_status default 'tentative',
    created_at timestamp not null default now(),
    confirmed_at timestamp,
    PRIMARY KEY (table_id, id));

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

INSERT INTO games (id, title, slug)
    VALUES ('8Mj1', 'Mexica', 'mexica');
INSERT INTO tables (id, game_id, created_by)
    VALUES ('823Wonk34yU', '8Mj1', '5e6b12f5-f24c-4fd3-8812-f537778dc5c2');
INSERT INTO seats (table_id, id, player_id, seq)
    VALUES ('823Wonk34yU', 'Hj3', '5e6b12f5-f24c-4fd3-8812-f537778dc5c2', 1),
           ('823Wonk34yU', '4jh', 'c8619345-0c1a-44c4-bdfe-e6e1de11c6bd', 2);
INSERT INTO events (table_id, seat_id, event, details)
    VALUES ('823Wonk34yU', null, 'start', '{"deck": []}'),
           ('823Wonk34yU', 'Hj3', 'draw', '{"cards": 1}'),
           ('823Wonk34yU', '4jh', 'draw', '{"cards": 2}');

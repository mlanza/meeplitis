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

CREATE TYPE seating_mode AS ENUM ('random', 'fixed', 'choice', 'bid');

CREATE TABLE games (
    id varchar(4) not null default generate_uid(4) primary key,
    title text not null,
    slug varchar(20),
    seats int2[] not null,
    thumbnail_url varchar,
    created_at timestamp not null default now());

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone."
  ON games FOR SELECT USING (true);

CREATE TABLE tables (
    id varchar(11) default generate_uid(11) not null primary key,
    game_id varchar(4) references games(id) not null,
    seating seating_mode default 'random',
    admins uuid [], -- users capable of editing during/after play
    up varchar [], -- seats required to take action
    scored boolean default true,
    started_at timestamp, -- used to delay start as in a tournament
    last_touch_id varchar(5), -- last touch (e.g. event applied to game)
    finished_at timestamp,
    keypass varchar, -- for restricting access, hashed
    config jsonb default '{}', -- configure this play
    status table_status not null default 'open',
    archived boolean default false, -- drops replability content to conserve space
    created_by uuid references auth.users(id) not null, -- this person can update before starting
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
    seq bigserial not null, -- guarantees order
    seat_id varchar(3),
    event varchar(15) not null,
    details jsonb not null,
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

INSERT INTO games (id, title, slug, seats)
    VALUES ('8Mj1', 'Oh Hell (Blackout)', 'oh-hell', ARRAY[2, 3, 4, 5, 6, 7]);

INSERT INTO events (table_id, event, details)
SELECT open_table(array[
    '5e6b12f5-f24c-4fd3-8812-f537778dc5c2'::uuid,
    'c8619345-0c1a-44c4-bdfe-e6e1de11c6bd'::uuid,
    '4c2e10da-a868-4098-aa0d-030644b4e4d7'::uuid,
    '8cb76dc4-4338-42d4-a324-b61fcb889bd1'::uuid], '8Mj1') as table_id,
    'start' as event,
    '{"id":"ZrTKK","type":"start","details":{"deck":[{"rank":"7","suit":"♣️"},{"rank":"4","suit":"♥️"},{"rank":"6","suit":"♣️"},{"rank":"10","suit":"♣️"},{"rank":"2","suit":"♦️"},{"rank":"4","suit":"♣️"},{"rank":"9","suit":"♦️"},{"rank":"Q","suit":"♠️"},{"rank":"8","suit":"♦️"},{"rank":"8","suit":"♥️"},{"rank":"4","suit":"♦️"},{"rank":"9","suit":"♥️"},{"rank":"2","suit":"♣️"},{"rank":"2","suit":"♥️"},{"rank":"9","suit":"♣️"},{"rank":"5","suit":"♠️"},{"rank":"K","suit":"♦️"},{"rank":"A","suit":"♣️"},{"rank":"7","suit":"♠️"},{"rank":"6","suit":"♠️"},{"rank":"6","suit":"♥️"},{"rank":"Q","suit":"♦️"},{"rank":"10","suit":"♠️"},{"rank":"J","suit":"♠️"},{"rank":"2","suit":"♠️"},{"rank":"7","suit":"♥️"},{"rank":"3","suit":"♣️"},{"rank":"J","suit":"♥️"},{"rank":"5","suit":"♥️"},{"rank":"5","suit":"♦️"},{"rank":"J","suit":"♦️"},{"rank":"6","suit":"♦️"},{"rank":"A","suit":"♦️"},{"rank":"8","suit":"♣️"},{"rank":"A","suit":"♠️"},{"rank":"A","suit":"♥️"},{"rank":"J","suit":"♣️"},{"rank":"K","suit":"♥️"},{"rank":"K","suit":"♣️"},{"rank":"Q","suit":"♣️"},{"rank":"3","suit":"♦️"},{"rank":"10","suit":"♦️"},{"rank":"3","suit":"♥️"},{"rank":"K","suit":"♠️"},{"rank":"10","suit":"♥️"},{"rank":"9","suit":"♠️"},{"rank":"5","suit":"♣️"},{"rank":"7","suit":"♦️"},{"rank":"Q","suit":"♥️"},{"rank":"3","suit":"♠️"},{"rank":"8","suit":"♠️"},{"rank":"4","suit":"♠️"}],"round":-1,"seated":[{"scored":[]},{"scored":[]},{"scored":[]},{"scored":[]}],"config":{}}}'::jsonb as details;

/*
UPDATE tables
SET last_touch_id = '6YTHx'
WHERE id = '823Wonk34yU';
*/

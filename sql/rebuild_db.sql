-- TODO define indexes

alter table tables drop constraint fk_last_touch;
drop table events;
drop table seats;
drop table tables;
drop table games;

drop type table_status;
drop type seating_mode;

create type table_status as enum ('open', 'vacant', 'full', 'started', 'locked', 'finished', 'abandoned');
-- open - players may freely join and leave
-- vacant - all players vacated before the game started
-- full - the full complement of players are seated, the game will start momentarily
-- started - the game is ready for moves (occurs once `start` event is added)
-- locked - admin action perhaps to resolve a concern
-- finished - the game has concluded
-- abandoned - the game was not concluded before time ran out

create type game_status as enum ('unlisted', 'up', 'down', 'capacity');

create type seating_mode as enum ('random', 'joined', 'picked');

create table logs(
  seq bigserial not null,
  message text not null,
  details jsonb,
  created_by uuid references auth.users on delete cascade not null default auth.uid(),
  created_at timestamp not null default now(),
  primary key (seq)
);

alter table logs enable row level security;

create policy "Users can insert their own log entries."
  on logs for insert with check (created_by = auth.uid());

create table profiles (
    id uuid not null references auth.users on delete cascade,
    username text null,
    avatar_url text null,
    headline character varying null,
    website text null,
    description text null,
    last_moved_at timestamp null,
    retain_history boolean not null default false,
    capacity smallint null, -- how many open/started tables can this user be present at?
    unique (username),
    constraint ck_username check (username ~ '^[a-zA-Z][a-zA-Z0-9\-_]{2,19}$');

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone."
  on profiles for select using (true);

create policy "Users can insert their own profile."
  on profiles for insert using (auth.uid() = id);

create policy "Users can update their own profile."
  on profiles for update using (auth.uid() = id);

create table admins (
    user_id uuid not null references auth.users on delete cascade);

alter table admins enable row level security;

create policy "Admins are viewable by everyone."
  on admins for select using (true);

create table games (
  id varchar(4) not null default generate_uid(4) primary key,
  title text not null,
  release varchar(3) not null default generate_uid(3),
  status game_status not null default 'unlisted',
  slug varchar(30) not null,
  seats int2[] not null,
  thumbnail_url varchar,
  created_at timestamp not null default now());

alter table games enable row level security;

create policy "Games are viewable by everyone."
  on games for select using (true);

create table tables (
  id varchar(11) default generate_uid(11) not null primary key,
  game_id varchar(4) references games(id) not null,
  release varchar(3) not null,
  seating seating_mode default 'random',
  config jsonb, -- configure this play
  up smallint[], -- seats required to take action
  keep boolean not null default false,
  seating_change_at timestamp,
  status table_status not null default 'open',
  dummy boolean not null default false, -- not real games, for testing
  clone_id varchar(11),
  last_touch_id varchar(5) references events(id), -- last event touching game state
  created_by uuid references profiles(id) not null default auth.uid(), -- this person can update before starting
  created_at timestamp not null default now(),
  updated_at timestamp,
  started_at timestamp,
  touched_at timestamp,
  finished_at timestamp,
  shredded_at timestamp
);

alter table tables enable row level security;

create policy "tables are viewable by everyone."
    on tables for select using (true);

alter table tables replica identity full;

create index idx_tables_game_status on tables (game_id, status);

create table seats (
  table_id varchar(11) references tables(id) on delete cascade,
  id varchar(3) not null default generate_uid(4),
  config jsonb, -- player specific configuration
  player_id uuid references profiles(id),
  seat smallint, -- must be provide before game starts
  place smallint, -- placement when finished
  metrics jsonb, -- scoring stats as data when finished
  brief jsonb, -- scoring stats as text when finished
  joined_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp,
  primary key (table_id, id),
  unique (table_id, seat)); -- seats are ordered beginning with 0 once game starts

alter table seats enable row level security;

create policy "Seats are viewable by everyone."
  on seats for select using (true);

create table events(
  table_id varchar(11) references tables(id) on delete cascade,
  id varchar(5) not null default generate_uid(5),
  seq bigserial not null, -- guarantees order
  seat_id varchar(3),
  type varchar(25) not null,
  details jsonb,
  snapshot jsonb,
  created_at timestamp not null default now(),
  constraint fk_events_seats
    foreign key(table_id, seat_id)
  references seats(table_id, id),
  primary key (table_id, id));

alter table events enable row level security;

create policy "Events are viewable by admins" on "public"."events"
  using ((exists ( select 1 from admins a where (a.user_id = auth.uid()))));

alter table tables
add constraint fk_last_touch
foreign key (id, last_touch_id)
references events(table_id, id);

create type notification_type as enum ('started', 'up', 'finished');

create table notifications (
  seq bigserial not null primary key,
  table_id varchar(11) references tables(id) on delete cascade,
  type notification_type not null,
  seats smallint[],
  response jsonb,
  completed boolean not null default false,
  created_at timestamp not null default now(),
  executed_at timestamp,
  tries smallint default 0);

alter table notifications enable row level security;

create index idx_notifications_status on notifications (completed, seq);

insert into games (id, title, slug, release, seats)
  values ('8Mj1', 'Oh Hell', 'oh-hell', 'kA4', array[2, 3, 4, 5, 6, 7]),
  values ('SopC', 'Mexica', 'mexica', 'H7z', array[2, 3, 4]);

do $$
declare
  _table_id varchar;
begin
  select open_table('8Mj1', '{}'::jsonb, 4::smallint, '5e6b12f5-f24c-4fd3-8812-f537778dc5c2'::uuid) into _table_id;
  perform join_table(_table_id, 'c8619345-0c1a-44c4-bdfe-e6e1de11c6bd'::uuid);
  perform join_table(_table_id, '4c2e10da-a868-4098-aa0d-030644b4e4d7'::uuid);
  perform join_table(_table_id, '8cb76dc4-4338-42d4-a324-b61fcb889bd1'::uuid);

end $$;

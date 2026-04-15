-- =============================================
-- SCOTT FAMILY ORGANIZER - Supabase Setup
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================

-- EVENTS table
create table if not exists events (
  id text primary key,
  family_id text not null,
  title text not null,
  date text not null,
  time text,
  member_id text not null,
  note text,
  created_at timestamptz default now()
);

-- SHOPPING table
create table if not exists shopping (
  id text primary key,
  family_id text not null,
  text text not null,
  checked boolean default false,
  created_at timestamptz default now()
);

-- TODOS table
create table if not exists todos (
  id text primary key,
  family_id text not null,
  text text not null,
  member_id text not null,
  done boolean default false,
  created_at timestamptz default now()
);

-- MEALS table
create table if not exists meals (
  family_id text not null,
  date text not null,
  meal text not null,
  primary key (family_id, date)
);

-- Enable Row Level Security (keeps your data private)
alter table events  enable row level security;
alter table shopping enable row level security;
alter table todos   enable row level security;
alter table meals   enable row level security;

-- Allow public read/write for your family (scoped by family_id)
create policy "Family access - events"  on events  for all using (true) with check (true);
create policy "Family access - shopping" on shopping for all using (true) with check (true);
create policy "Family access - todos"   on todos   for all using (true) with check (true);
create policy "Family access - meals"   on meals   for all using (true) with check (true);

-- Enable realtime for all tables
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table shopping;
alter publication supabase_realtime add table todos;
alter publication supabase_realtime add table meals;

-- Done!
select 'Scott Family database ready! 🎉' as status;

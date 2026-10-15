-- WhereWasIt? database setup. Paste into Supabase > SQL Editor > Run.

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  object_name text not null,
  category text not null default 'Other',
  image_path text,                      -- path inside the private storage bucket
  location_name text not null,
  notes text default '',
  remind boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sightings (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  image_path text,
  location_name text not null,
  notes text default '',
  recorded_at timestamptz not null default now()
);

create index on public.memories (user_id, updated_at desc);
create index on public.sightings (memory_id, recorded_at desc);
create index memories_search on public.memories
  using gin (to_tsvector('simple', object_name || ' ' || coalesce(notes,'') || ' ' || location_name));

-- Row Level Security: every user can only touch their own rows.
alter table public.memories enable row level security;
alter table public.sightings enable row level security;

create policy "own memories" on public.memories for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own sightings" on public.sightings for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (
    select 1 from public.memories m where m.id = memory_id and m.user_id = auth.uid()));

-- Private image bucket. Files live under <user id>/<file>.jpg
insert into storage.buckets (id, name, public) values ('memory-images', 'memory-images', false)
on conflict (id) do nothing;

create policy "read own images" on storage.objects for select to authenticated
  using (bucket_id = 'memory-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "upload own images" on storage.objects for insert to authenticated
  with check (bucket_id = 'memory-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "update own images" on storage.objects for update to authenticated
  using (bucket_id = 'memory-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own images" on storage.objects for delete to authenticated
  using (bucket_id = 'memory-images' and (storage.foldername(name))[1] = auth.uid()::text);
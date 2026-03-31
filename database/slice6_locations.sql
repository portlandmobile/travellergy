-- Travellergy — Slice 6: locations table + seed venues (Barcelona)
-- Run in Supabase SQL Editor after Slice 2 schema exists.

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid (),
  region_id uuid not null references public.regions (id) on delete cascade,
  name text not null,
  dish_id uuid references public.dishes (id) on delete set null
);

create index if not exists locations_region_id_idx on public.locations (region_id);

-- Idempotent seed for Barcelona + Paella venues
insert into public.locations (region_id, name, dish_id)
select r.id, 'Can Solé', d.id
from public.regions r
  join public.dishes d on d.slug = 'paella'
where
  r.slug = 'barcelona'
  and not exists (
    select 1
    from public.locations l
    where
      l.region_id = r.id
      and l.name = 'Can Solé'
  );

insert into public.locations (region_id, name, dish_id)
select r.id, '7 Portes', d.id
from public.regions r
  join public.dishes d on d.slug = 'paella'
where
  r.slug = 'barcelona'
  and not exists (
    select 1
    from public.locations l
    where
      l.region_id = r.id
      and l.name = '7 Portes'
  );

insert into public.locations (region_id, name, dish_id)
select r.id, 'Barceloneta Beach Kiosk', d.id
from public.regions r
  join public.dishes d on d.slug = 'paella'
where
  r.slug = 'barcelona'
  and not exists (
    select 1
    from public.locations l
    where
      l.region_id = r.id
      and l.name = 'Barceloneta Beach Kiosk'
  );

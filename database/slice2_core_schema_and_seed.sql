-- Travellergy — Slice 2: core schema + initial seed (Barcelona / Paella / seafood)
-- Run once in Supabase SQL Editor (Dashboard → SQL → New query).
-- Requires: PostGIS (enabled below). Safe to re-run mapping/ingredient inserts if you clear dependent rows first;
-- for a completely clean re-run, drop tables in reverse FK order (see bottom comment).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.regions (
  id uuid primary key default gen_random_uuid (),
  slug text not null unique,
  name text not null,
  country_code char(2) not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  geo geography(Point, 4326) not null
);

create index if not exists regions_slug_idx on public.regions (slug);

create index if not exists regions_geo_idx on public.regions using gist (geo);

create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid (),
  name_local text not null,
  name_en text not null,
  slug text not null unique,
  description text,
  is_common_allergen_risk boolean not null default false
);

create index if not exists dishes_slug_idx on public.dishes (slug);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid (),
  name text not null unique,
  risk_level text not null,
  description text
);

create index if not exists ingredients_name_idx on public.ingredients (name);

create table if not exists public.dish_ingredients (
  dish_id uuid not null references public.dishes (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  is_hidden_ingredient boolean not null default false,
  primary key (dish_id, ingredient_id)
);

create table if not exists public.region_dish_mapping (
  region_id uuid not null references public.regions (id) on delete cascade,
  dish_id uuid not null references public.dishes (id) on delete cascade,
  prevalence text not null default 'UNKNOWN',
  notes text,
  primary key (region_id, dish_id),
  constraint region_dish_mapping_prevalence_chk check (
    prevalence in ('UNKNOWN', 'UBIQUITOUS', 'COMMON', 'RARE', 'NONE')
  )
);

-- ---------------------------------------------------------------------------
-- Seed: Barcelona, Paella, seafood-related ingredients
-- ---------------------------------------------------------------------------
insert into public.regions (slug, name, country_code, latitude, longitude, geo)
values (
    'barcelona',
    'Barcelona',
    'ES',
    41.387397,
    2.168568,
    st_setsrid (st_makepoint (2.168568, 41.387397), 4326)::geography
  )
on conflict (slug) do nothing;

insert into public.dishes (name_local, name_en, slug, description, is_common_allergen_risk)
values (
    'Paella',
    'Paella',
    'paella',
    'Rice dish; coastal variants often include shellfish and fish-based stock.',
    true
  )
on conflict (slug) do nothing;

insert into public.ingredients (name, risk_level, description)
values
  ('shrimp', 'HIGH', 'Crustacean; common shellfish allergen.'),
  ('mussels', 'HIGH', 'Mollusk; common shellfish allergen.'),
  ('rice', 'LOW', 'Staple grain; low intrinsic allergen risk.'),
  ('saffron', 'LOW', 'Spice; rare allergy but note for sensitivity.'),
  ('fish stock', 'HIGH', 'Often hidden source of fish allergen in savory dishes.')
on conflict (name) do nothing;

insert into public.region_dish_mapping (region_id, dish_id, prevalence, notes)
select r.id, d.id, 'COMMON', 'Strongly associated with coastal Catalonia; seafood variants are typical.'
from public.regions r
  cross join public.dishes d
where
  r.slug = 'barcelona'
  and d.slug = 'paella'
on conflict (region_id, dish_id) do nothing;

insert into
  public.dish_ingredients (dish_id, ingredient_id, is_hidden_ingredient)
select d.id, i.id, v.is_hidden
from public.dishes d
  cross join (
    values
      ('shrimp', false),
      ('mussels', false),
      ('rice', false),
      ('saffron', false),
      ('fish stock', true)
  ) as v (ingredient_name, is_hidden)
  join public.ingredients i on i.name = v.ingredient_name
where
  d.slug = 'paella'
on conflict (dish_id, ingredient_id) do nothing;

-- ---------------------------------------------------------------------------
-- Verification (optional): run in dashboard Table Editor or as queries
-- ---------------------------------------------------------------------------
-- select * from regions where slug = 'barcelona';
-- select * from dishes where slug = 'paella';
-- select * from ingredients order by name;
-- select * from region_dish_mapping;
-- select * from dish_ingredients di
--   join dishes d on d.id = di.dish_id
--   join ingredients i on i.id = di.ingredient_id
--   where d.slug = 'paella';

-- Clean re-run (only if you need to drop everything from this slice):
-- delete from public.dish_ingredients;
-- delete from public.region_dish_mapping;
-- delete from public.ingredients;
-- delete from public.dishes;
-- delete from public.regions;

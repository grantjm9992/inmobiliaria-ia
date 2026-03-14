-- Casalista — Supabase schema
-- Run this in your Supabase SQL editor to bootstrap the database.

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fast text search

-- ─── Properties ──────────────────────────────────────────────────────────────
create table if not exists properties (
  id               uuid primary key default uuid_generate_v4(),
  source           text not null check (source in ('idealista','fotocasa','habitaclia','direct','manual')),
  source_id        text,
  source_url       text,
  title            text not null,
  description      text,
  type             text not null check (type in ('apartment','villa','townhouse','penthouse','studio','finca')),
  operation        text not null check (operation in ('sale','rent')),
  price            numeric not null,
  price_per_sqm    numeric,
  size             numeric not null,
  bedrooms         integer not null default 0,
  bathrooms        integer not null default 1,
  floor            integer,
  total_floors     integer,
  year_built       integer,
  energy_rating    text,
  city             text not null,
  neighbourhood    text,
  region           text not null,
  address          text,
  lat              double precision,
  lng              double precision,
  images           text[]   not null default '{}',
  features         text[]   not null default '{}',
  tags             text[]   not null default '{}',
  agent_name       text,
  agent_agency     text,
  agent_phone      text,
  agent_email      text,
  community_fees   numeric,
  ibi_tax          numeric,
  -- AI-enriched fields
  ranking_score       numeric,
  sunlight_score      numeric,
  transport_score     numeric,
  walkability_score   numeric,
  noise_score         numeric,
  rental_yield_estimate  numeric,
  airbnb_potential       numeric,
  price_vs_market        numeric, -- % above/below median for same type+city
  is_featured  boolean not null default false,
  is_active    boolean not null default true,
  scraped_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (source, source_id)
);

-- Full-text search generated column + index
alter table properties
  add column if not exists search_vector tsvector
    generated always as (
      to_tsvector('spanish',
        coalesce(title,'') || ' ' ||
        coalesce(description,'') || ' ' ||
        coalesce(city,'') || ' ' ||
        coalesce(neighbourhood,''))
    ) stored;

create index if not exists properties_fts on properties using gin (search_vector);

-- Spatial / filter indexes
create index if not exists properties_city       on properties (city);
create index if not exists properties_operation  on properties (operation);
create index if not exists properties_type       on properties (type);
create index if not exists properties_price      on properties (price);
create index if not exists properties_active     on properties (is_active) where is_active = true;

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger properties_updated_at before update on properties
  for each row execute function update_updated_at();

-- ─── Price history ────────────────────────────────────────────────────────────
create table if not exists price_history (
  id          uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  price       numeric not null,
  recorded_at timestamptz not null default now()
);
create index if not exists price_history_property on price_history (property_id, recorded_at desc);

-- ─── Neighbourhoods ───────────────────────────────────────────────────────────
create table if not exists neighbourhoods (
  id                   uuid primary key default uuid_generate_v4(),
  city                 text not null,
  name                 text not null,
  slug                 text not null unique,
  description          text,
  sunlight_score       numeric check (sunlight_score between 0 and 10),
  transport_score      numeric check (transport_score between 0 and 10),
  walkability_score    numeric check (walkability_score between 0 and 10),
  noise_score          numeric check (noise_score between 0 and 10),
  safety_score         numeric check (safety_score between 0 and 10),
  expat_friendliness   numeric check (expat_friendliness between 0 and 10),
  avg_price_sqm_sale   numeric,
  avg_price_sqm_rent   numeric,
  yoy_price_change     numeric,
  lat                  double precision,
  lng                  double precision,
  tags                 text[] not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger neighbourhoods_updated_at before update on neighbourhoods
  for each row execute function update_updated_at();

-- ─── Saved searches & favourites (require auth) ───────────────────────────────
create table if not exists saved_searches (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null,
  query          text not null,
  filters        jsonb not null default '{}',
  alert_enabled  boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists favourites (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null,
  property_id uuid not null references properties(id) on delete cascade,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (user_id, property_id)
);

-- ─── RLS policies ─────────────────────────────────────────────────────────────
alter table properties        enable row level security;
alter table neighbourhoods     enable row level security;
alter table saved_searches     enable row level security;
alter table favourites         enable row level security;
alter table price_history      enable row level security;

-- Anyone can read active properties
create policy "public_read_properties" on properties
  for select using (is_active = true);

-- Anyone can read neighbourhoods
create policy "public_read_neighbourhoods" on neighbourhoods
  for select using (true);

-- Price history readable
create policy "public_read_price_history" on price_history
  for select using (true);

-- Users own their saved searches & favourites
create policy "users_own_saved_searches" on saved_searches
  for all using (auth.uid() = user_id);

create policy "users_own_favourites" on favourites
  for all using (auth.uid() = user_id);

-- ─── Seed neighbourhood data ──────────────────────────────────────────────────
insert into neighbourhoods (city, name, slug, description, sunlight_score, transport_score, walkability_score, noise_score, safety_score, expat_friendliness, avg_price_sqm_sale, avg_price_sqm_rent, yoy_price_change, lat, lng, tags)
values
  ('Barcelona', 'Barceloneta',      'barcelona-barceloneta',      'Iconic beach neighbourhood with a vibrant atmosphere.',         7.5, 8.0, 9.0, 5.5, 6.5, 9.5, 6800, 25, 8.2,  41.3785, 2.1925, ARRAY['beach','tourist','nightlife','expat']),
  ('Barcelona', 'Eixample Esquerra','barcelona-eixample-esquerra', 'Trendy, walkable Modernista grid with excellent transit.',       6.5, 9.5, 9.5, 6.0, 8.0, 9.0, 5200, 19, 6.1,  41.3836, 2.1514, ARRAY['central','walkable','lgbtq-friendly','cafes']),
  ('Barcelona', 'Sarrià',           'barcelona-sarria',            'Quiet residential village feel within the city.',               8.5, 6.5, 7.5, 8.5, 9.0, 7.0, 6200, 22, 4.8,  41.4019, 2.1173, ARRAY['quiet','family','green','prestigious']),
  ('Barcelona', 'Pedralbes',        'barcelona-pedralbes',         'Ultra-prestigious area with embassies and luxury villas.',      8.5, 5.5, 6.5, 9.0, 9.5, 8.0, 8000, 28, 5.2,  41.3897, 2.1108, ARRAY['luxury','quiet','villas','embassies']),
  ('Barcelona', 'Barri Gòtic',      'barcelona-barri-gotic',       'Historic Gothic Quarter, tourist-heavy, medieval streets.',     6.0, 9.0, 9.5, 4.0, 6.5, 8.5, 5800, 22, 7.3,  41.3821, 2.1769, ARRAY['historic','central','tourist','expat']),
  ('Barcelona', 'Vila Olímpica',    'barcelona-vila-olimpica',     'Modern marina district with sea views and good amenities.',     8.0, 7.5, 8.0, 7.0, 7.5, 8.5, 5500, 21, 5.9,  41.3883, 2.1975, ARRAY['modern','sea-views','marina','young-professionals']),
  ('Madrid',    'Barrio Salamanca', 'madrid-salamanca',            'Madrid''s most prestigious residential neighbourhood.',        7.0, 9.0, 9.5, 5.5, 9.0, 9.0, 7500, 30, 7.8,  41.4312, -3.6817,ARRAY['luxury','prestigious','shopping','expat']),
  ('Madrid',    'Pozuelo',          'madrid-pozuelo',              'Affluent suburb popular with families and international schools.',8.0, 5.5, 6.5, 9.0, 9.5, 8.5, 3800, 16, 3.2,  40.4374, -3.8111,ARRAY['suburb','family','schools','quiet']),
  ('Marbella',  'La Zagaleta',      'marbella-la-zagaleta',        'Ultra-exclusive gated estate, most expensive in Spain.',       9.0, 4.0, 4.0, 10.0,9.5, 8.0,12000, 40, 6.5,  36.5085, -4.8859,ARRAY['ultra-luxury','gated','golf','privacy']),
  ('Valencia',  'La Marina',        'valencia-la-marina',          'Regenerated marina area with modern apartments and beach access.',8.5, 7.5, 8.5, 7.0, 7.5, 8.5, 4200, 18, 9.8,  39.4515, -0.3263,ARRAY['modern','marina','beach','investment'])
on conflict (slug) do nothing;

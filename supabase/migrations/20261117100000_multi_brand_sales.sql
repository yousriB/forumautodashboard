-- Multi-brand sales accounts, brand catalogue, brand-scoped test drives and
-- the Nouveau → En cours → Vente confirmée → Livré workflow.
--
-- Status values stored in the database are unchanged:
--   pending = Nouveau, processing = En cours, sold = Vente confirmée,
--   completed = Livré, rejected = Annulé.
-- No existing row's status is rewritten by this migration.

-- ─── 1. Brand catalogue ──────────────────────────────────────────────────────
create table if not exists public.brands (
  code        text primary key
              check (code = upper(btrim(code)) and char_length(code) between 1 and 50),
  label       text not null,
  active      boolean not null default true,
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now()
);

comment on table public.brands is
  'Brand codes as stored in car_brand columns (website + dashboard). active=false keeps historical brands (e.g. FORD) out of new selections.';

insert into public.brands (code, label, active, sort_order) values
  ('BYD',            'BYD',              true,  10),
  ('CHERY',          'CHERY',            true,  20),
  ('CHEVROLET',      'CHEVROLET',        true,  30),
  ('DACIA',          'DACIA',            true,  40),
  ('DFSK',           'DFSK',             true,  50),
  ('DONGFENG',       'DONGFENG',         true,  60),
  ('GAC',            'GAC MOTOR',        true,  70),
  ('GREAT WALL',     'GREAT WALL (GWM)', true,  80),
  ('HAVAL',          'HAVAL',            true,  90),
  ('ISUZU',          'ISUZU',            true, 100),
  ('MG',             'MG',               true, 110),
  ('NISSAN',         'NISSAN',           true, 120),
  ('OMODA & JAECOO', 'OMODA & JAECOO',   true, 130),
  ('RENAULT',        'RENAULT',          true, 140),
  ('SUZUKI',         'SUZUKI',           true, 150),
  ('TOYOTA',         'TOYOTA',           true, 160),
  ('FORD',           'FORD',             false, 900)
on conflict (code) do update
  set label = excluded.label, active = excluded.active, sort_order = excluded.sort_order;

-- Any brand already present in sales data or user profiles but missing above
-- is kept as an inactive historical brand (nothing is lost, nothing duplicated).
insert into public.brands (code, label, active, sort_order)
select distinct upper(btrim(b)), upper(btrim(b)), false, 950
from (
  select car_brand as b from public.devis_requests
  union select car_brand from public.custom_devis_requests
  union select brand from public.users
) s
where nullif(btrim(b), '') is not null
on conflict (code) do nothing;

alter table public.brands enable row level security;
revoke all on public.brands from public, anon, authenticated;
grant select on public.brands to authenticated;
drop policy if exists brands_staff_select on public.brands;
create policy brands_staff_select on public.brands
  for select to authenticated using (true);

-- ─── 2. Brands assigned to each staff account ────────────────────────────────
create table if not exists public.user_brands (
  user_id     uuid not null references public.users(id) on delete cascade,
  brand       text not null references public.brands(code) on update cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, brand)
);
create index if not exists user_brands_brand_idx on public.user_brands (brand);

comment on table public.user_brands is
  'Brands a sales account may access. Written only through set_user_brands() / the admin-users edge function.';
comment on column public.users.brand is
  'LEGACY: mirror of the first brand in user_brands, kept for old clients. Access control uses user_brands.';

-- Carry over existing single-brand assignments.
insert into public.user_brands (user_id, brand)
select u.id, upper(btrim(u.brand))
from public.users u
where u.role = 'sales' and nullif(btrim(u.brand), '') is not null
on conflict do nothing;

-- The caller's own profile row (profiles match by auth id, legacy ones by email).
create or replace function public.staff_profile_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.id = auth.uid()
     or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  order by (u.id = auth.uid()) desc nulls last
  limit 1
$$;

create or replace function public.staff_brands()
returns text[]
language sql stable security definer
set search_path = public
as $$
  select coalesce(array_agg(ub.brand order by ub.brand), '{}'::text[])
  from public.user_brands ub
  where ub.user_id = public.staff_profile_id()
$$;

alter table public.user_brands enable row level security;
revoke all on public.user_brands from public, anon, authenticated;
grant select on public.user_brands to authenticated;
drop policy if exists user_brands_select_own_or_admin on public.user_brands;
create policy user_brands_select_own_or_admin on public.user_brands
  for select to authenticated
  using (
    user_id = (select public.staff_profile_id())
    or (select public.staff_role()) = 'admin'
  );

-- Sales: only their assigned brands. No brands assigned = no access
-- (previously an empty brand meant "all brands").
create or replace function public.can_access_brand(p_brand text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select case public.staff_role()
    when 'admin' then true
    when 'sales' then p_brand is not null and p_brand = any (public.staff_brands())
    else false
  end
$$;

-- Admin-only: replace the brand list of a staff account.
create or replace function public.set_user_brands(p_user_id uuid, p_brands text[])
returns text[]
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_role  text;
  v_clean text[];
  v_bad   text;
begin
  if coalesce(public.staff_role(), '') <> 'admin' then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  select role into v_role from public.users where id = p_user_id;
  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(distinct upper(btrim(b))), '{}'::text[])
    into v_clean
  from unnest(coalesce(p_brands, '{}'::text[])) b
  where nullif(btrim(b), '') is not null;

  -- Brands already assigned may be kept even if since deactivated; new ones must be active.
  select b into v_bad
  from unnest(v_clean) b
  where not exists (select 1 from public.brands x where x.code = b and x.active)
    and not exists (select 1 from public.user_brands ub where ub.user_id = p_user_id and ub.brand = b)
  limit 1;
  if v_bad is not null then
    raise exception 'Invalid or inactive brand: %', v_bad using errcode = '22023';
  end if;

  if v_role <> 'sales' then
    v_clean := '{}'::text[];
  end if;

  delete from public.user_brands where user_id = p_user_id and not (brand = any (v_clean));
  insert into public.user_brands (user_id, brand)
  select p_user_id, b from unnest(v_clean) b
  on conflict do nothing;

  update public.users
     set brand = (select min(b) from unnest(v_clean) b)
   where id = p_user_id;

  return v_clean;
end;
$$;

revoke all on function public.set_user_brands(uuid, text[]) from public, anon;
grant execute on function public.set_user_brands(uuid, text[]) to authenticated;
revoke all on function public.staff_brands() from public, anon;
grant execute on function public.staff_brands() to authenticated;
revoke all on function public.staff_profile_id() from public, anon;
grant execute on function public.staff_profile_id() to authenticated;

-- ─── 3. Devis tables: policies with cached role/brand lookups ────────────────
drop policy if exists devis_staff_select on public.devis_requests;
create policy devis_staff_select on public.devis_requests
  for select to authenticated
  using (
    (select public.staff_role()) = 'admin'
    or ((select public.staff_role()) = 'sales' and car_brand = any ((select public.staff_brands())::text[]))
  );

drop policy if exists devis_staff_update on public.devis_requests;
create policy devis_staff_update on public.devis_requests
  for update to authenticated
  using (
    (select public.staff_role()) = 'admin'
    or ((select public.staff_role()) = 'sales' and car_brand = any ((select public.staff_brands())::text[]))
  )
  with check (
    (select public.staff_role()) = 'admin'
    or ((select public.staff_role()) = 'sales' and car_brand = any ((select public.staff_brands())::text[]))
  );

drop policy if exists custom_devis_staff_select on public.custom_devis_requests;
create policy custom_devis_staff_select on public.custom_devis_requests
  for select to authenticated
  using (
    (select public.staff_role()) = 'admin'
    or ((select public.staff_role()) = 'sales' and car_brand = any ((select public.staff_brands())::text[]))
  );

drop policy if exists custom_devis_staff_update on public.custom_devis_requests;
create policy custom_devis_staff_update on public.custom_devis_requests
  for update to authenticated
  using (
    (select public.staff_role()) = 'admin'
    or ((select public.staff_role()) = 'sales' and car_brand = any ((select public.staff_brands())::text[]))
  )
  with check (
    (select public.staff_role()) = 'admin'
    or ((select public.staff_role()) = 'sales' and car_brand = any ((select public.staff_brands())::text[]))
  );

-- ─── 4. Test drives get a real brand column ──────────────────────────────────
-- The website stores "<BRAND> <model>" in car_model; derive the brand from it.
alter table public.test_drive_requests add column if not exists car_brand text;

create or replace function public.derive_brand_from_model(p_model text)
returns text
language sql stable security definer
set search_path = public
as $$
  select b.code
  from public.brands b
  where upper(btrim(p_model)) = b.code
     or left(upper(btrim(p_model)), char_length(b.code) + 1) = b.code || ' '
  order by char_length(b.code) desc
  limit 1
$$;
revoke all on function public.derive_brand_from_model(text) from public, anon, authenticated;

create or replace function public.test_drive_set_brand()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  new.car_brand := public.derive_brand_from_model(new.car_model);
  return new;
end;
$$;
revoke all on function public.test_drive_set_brand() from public, anon, authenticated;

drop trigger if exists test_drive_set_brand on public.test_drive_requests;
create trigger test_drive_set_brand
  before insert or update of car_model, car_brand on public.test_drive_requests
  for each row execute function public.test_drive_set_brand();

update public.test_drive_requests
   set car_brand = public.derive_brand_from_model(car_model)
 where car_brand is distinct from public.derive_brand_from_model(car_model);

create index if not exists test_drive_requests_car_brand_idx on public.test_drive_requests (car_brand);

drop policy if exists test_drive_staff_select on public.test_drive_requests;
create policy test_drive_staff_select on public.test_drive_requests
  for select to authenticated
  using (
    (select public.staff_role()) = 'admin'
    or ((select public.staff_role()) = 'sales' and car_brand = any ((select public.staff_brands())::text[]))
  );

drop policy if exists test_drive_staff_update on public.test_drive_requests;
create policy test_drive_staff_update on public.test_drive_requests
  for update to authenticated
  using (
    (select public.staff_role()) = 'admin'
    or ((select public.staff_role()) = 'sales' and car_brand = any ((select public.staff_brands())::text[]))
  )
  with check (
    (select public.staff_role()) = 'admin'
    or ((select public.staff_role()) = 'sales' and car_brand = any ((select public.staff_brands())::text[]))
  );

create or replace function public.update_test_drive_status(p_id uuid, p_new_status text)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_updated_row jsonb;
  v_brand       text;
  v_role        text := public.staff_role();
  v_is_service  boolean := coalesce(auth.role(), '') = 'service_role';
begin
  if coalesce(v_role, '') not in ('admin', 'sales') and not v_is_service then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if p_new_status not in ('pending','confirmed','completed','cancelled') then
    raise exception 'Invalid test drive status: %', p_new_status using errcode = '22023';
  end if;

  select car_brand into v_brand from public.test_drive_requests where id = p_id for update;
  if not found then
    raise exception 'Test drive request not found: %', p_id using errcode = 'P0002';
  end if;
  if v_role = 'sales' and not v_is_service and not public.can_access_brand(v_brand) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  update public.test_drive_requests set status = p_new_status where id = p_id
    returning to_jsonb(test_drive_requests.*) into v_updated_row;
  return v_updated_row;
end;
$$;

-- ─── 5. Sales workflow: Nouveau → En cours → Vente confirmée → Livré ─────────
create or replace function public.update_devis_status(
  p_id uuid, p_new_status text, p_type text, p_is_admin boolean default false)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_table_name  text;
  v_current     text;
  v_brand       text;
  v_updated_row jsonb;
  v_allowed     boolean := false;
  v_role        text := public.staff_role();
  -- p_is_admin from the client is ignored: the role is read server-side.
  v_is_admin    boolean := (v_role = 'admin') or coalesce(auth.role(), '') = 'service_role';
begin
  if not v_is_admin and coalesce(v_role, '') <> 'sales' then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if p_type = 'standard' then v_table_name := 'devis_requests';
  elsif p_type = 'custom' then v_table_name := 'custom_devis_requests';
  else raise exception 'Invalid devis type: %', p_type using errcode = '22023';
  end if;

  if p_new_status not in ('pending','processing','completed','rejected','sold') then
    raise exception 'Invalid devis status: %', p_new_status using errcode = '22023';
  end if;

  execute format('select status, car_brand from public.%I where id = $1 for update', v_table_name)
    into v_current, v_brand using p_id;

  if v_current is null then
    raise exception 'Devis request not found: %', p_id using errcode = 'P0002';
  end if;

  if not v_is_admin and not public.can_access_brand(v_brand) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if v_is_admin then
    v_allowed := true;
  else
    v_allowed := case v_current
      when 'pending'    then p_new_status in ('processing','rejected')   -- Nouveau → En cours / Annulé
      when 'processing' then p_new_status in ('sold','rejected')         -- En cours → Vente confirmée / Annulé
      when 'sold'       then p_new_status in ('completed','rejected')    -- Vente confirmée → Livré / Annulé
      else false                                                          -- Livré, Annulé: final
    end;
  end if;

  if not v_allowed then
    raise exception 'Invalid status transition: % -> %', v_current, p_new_status using errcode = '23514';
  end if;

  execute format('update public.%I set status = $1 where id = $2 returning to_jsonb(%I.*)',
                 v_table_name, v_table_name)
    into v_updated_row using p_new_status, p_id;

  return v_updated_row;
end;
$$;

-- Historical data fix (2026-11-17).
-- In the old workflow "completed" meant "sale confirmed". Since the new workflow
-- (multi_brand_sales, applied 2026-11-17 09:32 UTC) "completed" means "Livré"
-- (delivered). Every devis still in status 'completed' was set before that
-- update (latest completed_at: 2026-11-17 08:45 UTC, none changed through the
-- new status function: responded_by is null on all of them), so they are moved
-- to 'sold' (Vente confirmée).
--
--  * status        completed -> sold
--  * sold_at       keeps its value, or takes the old completed_at (the date the
--                  sale was confirmed in the old workflow)
--  * completed_at  cleared: the vehicle is not known to be delivered
--  * everything else (customer, vehicle, payment, notes) is untouched
--
-- Only rows whose completed_at is before the workflow update (or null) are
-- touched, so a vehicle marked "Livré" after the update is never changed.
-- The previous values are kept in private.devis_status_migration_backup.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.devis_status_migration_backup (
  table_name   text        not null,
  id           uuid        not null,
  old_status   text        not null,
  old_sold_at  timestamptz,
  old_completed_at timestamptz,
  old_responded_at timestamptz,
  migrated_at  timestamptz not null default now(),
  primary key (table_name, id)
);
alter table private.devis_status_migration_backup enable row level security;
revoke all on private.devis_status_migration_backup from public, anon, authenticated;

insert into private.devis_status_migration_backup (table_name, id, old_status, old_sold_at, old_completed_at, old_responded_at)
select 'custom_devis_requests', id, status, sold_at, completed_at, responded_at
  from public.custom_devis_requests
 where status = 'completed'
   and (completed_at is null or completed_at < '2026-11-17 09:32:00+00')
on conflict do nothing;

insert into private.devis_status_migration_backup (table_name, id, old_status, old_sold_at, old_completed_at, old_responded_at)
select 'devis_requests', id, status, sold_at, completed_at, responded_at
  from public.devis_requests
 where status = 'completed'
   and (completed_at is null or completed_at < '2026-11-17 09:32:00+00')
on conflict do nothing;

-- The status-change triggers would stamp sold_at / responded_at with now();
-- switch them off for this one historical correction only.
alter table public.custom_devis_requests disable trigger on_custom_devis_status_change;
alter table public.devis_requests disable trigger on_devis_status_change;

update public.custom_devis_requests r
   set status = 'sold',
       sold_at = coalesce(r.sold_at, r.completed_at),
       completed_at = null
  from private.devis_status_migration_backup b
 where b.table_name = 'custom_devis_requests' and b.id = r.id and r.status = 'completed';

update public.devis_requests r
   set status = 'sold',
       sold_at = coalesce(r.sold_at, r.completed_at),
       completed_at = null
  from private.devis_status_migration_backup b
 where b.table_name = 'devis_requests' and b.id = r.id and r.status = 'completed';

alter table public.custom_devis_requests enable trigger on_custom_devis_status_change;
alter table public.devis_requests enable trigger on_devis_status_change;

-- To undo:
--   update public.custom_devis_requests r set status = b.old_status, sold_at = b.old_sold_at, completed_at = b.old_completed_at
--     from private.devis_status_migration_backup b where b.table_name = 'custom_devis_requests' and b.id = r.id;
--   (same for devis_requests, with the triggers disabled as above)

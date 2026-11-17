-- One-off data fix requested by the owner (2026-11-17): legacy "completed"
-- (Livré) devis from the old workflow had no sold_at. Use the delivery date as
-- the sale date. Status is unchanged, so the status-change trigger does not fire.
-- Rows without completed_at are left as they are.
update public.custom_devis_requests
   set sold_at = completed_at
 where status = 'completed' and sold_at is null and completed_at is not null;

update public.devis_requests
   set sold_at = completed_at
 where status = 'completed' and sold_at is null and completed_at is not null;

-- Dashboard monthly stats: classify each request by its actual status column
-- (Nouveau / En cours / Vente confirmée / Livré / Annulé) and count it in the
-- month it reached that status. The old version guessed the status from the
-- latest timestamp, so sales from the old workflow that still carry a
-- completed_at (old meaning: sale confirmed) were counted as "Livré".
-- Same signature, return columns, SECURITY INVOKER (RLS applies) and grants.
create or replace function public.get_monthly_car_stats(target_year integer, target_month integer, target_brand text)
returns table(created_count bigint, processing_count bigint, completed_count bigint, sold_count bigint, rejected_count bigint)
language plpgsql
set search_path to 'public'
as $function$
begin
  return query
  with combined as (
    select car_brand, status::text as status, created_at, processed_at, completed_at, sold_at, rejected_at
      from public.devis_requests
    union all
    select car_brand, status::text, created_at, processed_at, completed_at, sold_at, rejected_at
      from public.custom_devis_requests
  ),
  classified as (
    select
      case status when 'pending' then 'created' else status end as latest_status,
      coalesce(
        case status
          when 'pending'    then created_at
          when 'processing' then processed_at
          when 'sold'       then sold_at
          when 'completed'  then completed_at
          when 'rejected'   then rejected_at
        end,
        greatest(created_at, processed_at, completed_at, sold_at, rejected_at)
      ) as status_at
    from combined
    where target_brand = 'All' or car_brand = target_brand
  )
  select
    count(*) filter (where latest_status = 'created'),
    count(*) filter (where latest_status = 'processing'),
    count(*) filter (where latest_status = 'completed'),
    count(*) filter (where latest_status = 'sold'),
    count(*) filter (where latest_status = 'rejected')
  from classified
  where extract(year from status_at) = target_year
    and extract(month from status_at) = target_month;
end;
$function$;

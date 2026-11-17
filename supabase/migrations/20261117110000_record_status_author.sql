-- Record which staff account last changed a devis status (responded_by was
-- never filled before). Lets the Export & Rapports page attribute sales to the
-- commercial who handled them, for changes made from now on.
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
  v_actor       uuid := public.staff_profile_id();
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

  execute format(
    'update public.%I set status = $1, responded_by = coalesce($3, responded_by) where id = $2 returning to_jsonb(%I.*)',
    v_table_name, v_table_name)
    into v_updated_row using p_new_status, p_id, v_actor;

  return v_updated_row;
end;
$$;

comment on column public.devis_requests.responded_by is
  'public.users.id of the staff account that last changed the status (filled from 2026-11-17).';
comment on column public.custom_devis_requests.responded_by is
  'public.users.id of the staff account that last changed the status (filled from 2026-11-17).';

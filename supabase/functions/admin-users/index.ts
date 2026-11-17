// admin-users: create / delete staff accounts and reset their password for
// the Sales Dashboard. Brand lists of existing accounts are changed through
// the set_user_brands() RPC instead (admin-only, checked in the database).
//
// The service-role key lives only here (SUPABASE_SERVICE_ROLE_KEY is injected
// by Supabase into every edge function). The browser sends its own session
// JWT; we check that the caller is an admin in public.users before acting.
import { createClient } from "npm:@supabase/supabase-js@2";

// Prefer the new secret key (sb_secret_...), fall back to the legacy service_role JWT.
function serviceKey(): string {
  try {
    const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}")?.default;
    if (k) return k;
  } catch { /* fall through */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

// CORS is not the security boundary here: every request must carry the
// session JWT of a signed-in admin (checked below), so any origin may call.
function corsHeaders(_origin: string | null) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const ROLES = ["admin", "sales", "support"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, serviceKey(), { auth: { persistSession: false, autoRefreshToken: false } });

  // 1. Who is calling?
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return reply(401, { error: "Not authenticated" });
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  if (whoErr || !who.user) return reply(401, { error: "Not authenticated" });

  // 2. Is the caller an admin? (profiles match by id or by email)
  const callerEmail = (who.user.email ?? "").toLowerCase();
  const byId = await admin.from("users").select("role").eq("id", who.user.id).limit(1);
  const byEmail = callerEmail
    ? await admin.from("users").select("role").ilike("email", callerEmail.replace(/[%_\\]/g, "\\$&")).limit(5)
    : { data: [] };
  const roles = [...(byId.data ?? []), ...(byEmail.data ?? [])].map((p) => p.role);
  if (!roles.includes("admin")) return reply(403, { error: "Forbidden" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Invalid JSON" });
  }

  // 3. Act
  // Only accounts with a Sales Dashboard profile can be acted on (never, say,
  // an atelier-only account). Most profiles share the auth user's id; older
  // ones only match by email.
  async function resolveAuthId(profileId: string): Promise<string | null> {
    const { data: target } = await admin.from("users").select("email").eq("id", profileId).maybeSingle();
    if (!target) return null;
    const { data: direct } = await admin.auth.admin.getUserById(profileId);
    if (direct?.user) return profileId;
    const targetEmail = target.email?.toLowerCase();
    if (!targetEmail) return null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    return list?.users.find((u) => u.email?.toLowerCase() === targetEmail)?.id ?? null;
  }

  if (body.action === "create") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = String(body.role ?? "");
    // `brands` (array) is current; `brand` (string) is accepted from old clients.
    const rawBrands = Array.isArray(body.brands) ? body.brands : body.brand ? [body.brand] : [];
    const brands = [...new Set(rawBrands.map((b) => String(b).trim().toUpperCase()).filter(Boolean))].sort();
    if (!EMAIL_RE.test(email) || email.length > 254) return reply(400, { error: "Email invalide" });
    if (password.length < 8 || password.length > 72) return reply(400, { error: "Mot de passe: 8 à 72 caractères" });
    if (!ROLES.includes(role)) return reply(400, { error: "Rôle invalide" });
    if (role === "sales") {
      if (brands.length === 0) return reply(400, { error: "Sélectionnez au moins une marque" });
      if (brands.length > 50) return reply(400, { error: "Trop de marques" });
      const { data: known } = await admin.from("brands").select("code").eq("active", true).in("code", brands);
      const knownSet = new Set((known ?? []).map((b) => b.code));
      const bad = brands.find((b) => !knownSet.has(b));
      if (bad) return reply(400, { error: `Marque invalide ou inactive : ${bad}` });
    }
    const assigned = role === "sales" ? brands : [];

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { role },
    });
    if (createErr || !created.user) return reply(400, { error: createErr?.message ?? "Création impossible" });

    const { data: profile, error: profErr } = await admin
      .from("users")
      .insert({ id: created.user.id, email, role, brand: assigned[0] ?? null })
      .select("id, email, role, brand, created_at")
      .single();
    if (profErr) {
      await admin.auth.admin.deleteUser(created.user.id); // roll back the auth account
      return reply(500, { error: "Création du profil impossible" });
    }

    if (assigned.length > 0) {
      const { error: brandErr } = await admin
        .from("user_brands")
        .insert(assigned.map((brand) => ({ user_id: created.user.id, brand })));
      if (brandErr) {
        await admin.from("users").delete().eq("id", created.user.id);
        await admin.auth.admin.deleteUser(created.user.id);
        return reply(500, { error: "Attribution des marques impossible" });
      }
    }
    return reply(200, { user: { ...profile, brands: assigned } });
  }

  if (body.action === "set_password") {
    const id = String(body.id ?? "");
    const password = String(body.password ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "Identifiant invalide" });
    if (password.length < 8 || password.length > 72) return reply(400, { error: "Mot de passe: 8 à 72 caractères" });
    const authId = await resolveAuthId(id);
    if (!authId) return reply(404, { error: "Compte introuvable" });
    const { error: pwErr } = await admin.auth.admin.updateUserById(authId, { password });
    if (pwErr) return reply(400, { error: pwErr.message });
    return reply(200, { ok: true });
  }

  if (body.action === "delete") {
    const id = String(body.id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "Identifiant invalide" });
    if (id === who.user.id) return reply(400, { error: "Impossible de supprimer votre propre compte" });

    const authId = await resolveAuthId(id);
    if (authId === who.user.id) return reply(400, { error: "Impossible de supprimer votre propre compte" });
    if (authId) {
      const { error: delErr } = await admin.auth.admin.deleteUser(authId);
      if (delErr) return reply(400, { error: delErr.message });
    }
    const { error: profErr } = await admin.from("users").delete().eq("id", id);
    if (profErr) return reply(500, { error: "Suppression du profil impossible" });
    return reply(200, { ok: true });
  }

  return reply(400, { error: "Unknown action" });
});

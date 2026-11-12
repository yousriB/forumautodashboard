// admin-users: create / delete staff accounts for the Sales Dashboard.
//
// The service-role key lives only here (SUPABASE_SERVICE_ROLE_KEY is injected
// by Supabase into every edge function). The browser sends its own session
// JWT; we check that the caller is an admin in public.users before acting.
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
];

function corsHeaders(origin: string | null) {
  const allowed =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) ||
      /^https:\/\/([a-z0-9-]+\.)?forumautogabes\.com$/.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "null",
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
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

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
  if (body.action === "create") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = String(body.role ?? "");
    const brand = body.brand ? String(body.brand).slice(0, 50) : null;
    if (!EMAIL_RE.test(email) || email.length > 254) return reply(400, { error: "Email invalide" });
    if (password.length < 8 || password.length > 72) return reply(400, { error: "Mot de passe: 8 à 72 caractères" });
    if (!ROLES.includes(role)) return reply(400, { error: "Rôle invalide" });

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { role, brand },
    });
    if (createErr || !created.user) return reply(400, { error: createErr?.message ?? "Création impossible" });

    const { data: profile, error: profErr } = await admin
      .from("users")
      .insert({ id: created.user.id, email, role, brand })
      .select("id, email, role, brand, created_at")
      .single();
    if (profErr) {
      await admin.auth.admin.deleteUser(created.user.id); // roll back the auth account
      return reply(500, { error: "Création du profil impossible" });
    }
    return reply(200, { user: profile });
  }

  if (body.action === "delete") {
    const id = String(body.id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "Identifiant invalide" });
    if (id === who.user.id) return reply(400, { error: "Impossible de supprimer votre propre compte" });

    // Most profiles share the auth user's id; older ones only match by email.
    const { data: target } = await admin.from("users").select("email").eq("id", id).maybeSingle();
    let authId: string | null = id;
    const { data: direct } = await admin.auth.admin.getUserById(id);
    if (!direct?.user) {
      authId = null;
      const targetEmail = target?.email?.toLowerCase();
      if (targetEmail) {
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        authId = list?.users.find((u) => u.email?.toLowerCase() === targetEmail)?.id ?? null;
      }
    }
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

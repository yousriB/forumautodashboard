import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/dashboard/BrandMark";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { logSecurityEvent } from "@/lib/security-logger";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const { setUser } = useUser();
  const navigate    = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ── 1. Authenticate via Supabase Auth ─────────────────────────────────
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.user) {
        // ── Log failed attempt ───────────────────────────────────────────────
        await logSecurityEvent({
          event_type:  'login_attempt',
          severity:    'medium',
          status_code: 401,
          endpoint:    '/auth/login',
          method:      'POST',
          metadata: {
            email,
            error: authError?.message ?? 'Erreur inconnue',
          },
        });

        setError("Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      // ── 2. Fetch role + brand from the users profile table ────────────────
      // Previously this duplicated the profile fetch that UserContext already
      // performs in its onAuthStateChange listener. We still need the role
      // here for the post-login redirect, so we fetch ONCE and pass it to
      // UserContext via setUser — the context's cache then short-circuits
      // its own fetch when the listener fires for the same auth id.
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, email, role, brand, user_brands(brand)")
        .or(`id.eq.${authData.user.id},email.eq.${email}`)
        .maybeSingle();

      if (profileError) {
        console.error("[Login] Profile fetch error:", profileError.message);
      }

      if (!profile?.role) {
        // Auth succeeded but no profile row found — sign out and report
        await supabase.auth.signOut();
        setError("Profil introuvable. Contactez l'administrateur.");
        setLoading(false);
        return;
      }

      // ── 3. Log successful attempt ─────────────────────────────────────────
      await logSecurityEvent({
        event_type:  'login_attempt',
        severity:    'low',
        status_code: 200,
        user_id:     authData.user.id,
        endpoint:    '/auth/login',
        method:      'POST',
        metadata:    { email },
      });

      // ── 4. Set user in context (warms UserContext's profile cache) ────────
      setUser({
        id:    authData.user.id,
        email: authData.user.email ?? email,
        role:  profile.role,
        brand: profile.brand ?? null,
        brands: ((profile.user_brands ?? []) as { brand: string }[]).map((b) => b.brand).sort(),
      });

      // ── 5. Redirect by role ───────────────────────────────────────────────
      if (profile.role === "support") {
        navigate("/appointments");
      } else if (profile.role === "admin") {
        navigate("/dashboard");
      } else if (profile.role === "sales") {
        navigate("/devis");
      } else {
        setError("Rôle inconnu. Veuillez contacter l'administrateur.");
      }
    } catch (err: unknown) {
      console.error("[Login] Unexpected error:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background-secondary p-3">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-3 lg:grid-cols-[1.1fr_1fr]">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden rounded-3xl bg-ink p-10 text-white lg:flex lg:flex-col">
          <BrandLogo variant="white" className="h-12" />

          <div className="mt-auto max-w-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/50">Espace ventes</p>
            <h1 className="mt-3 text-5xl font-light leading-[1.05] tracking-tight">
              Chaque demande,
              <br />
              <span className="text-white/45">sur un seul écran.</span>
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-white/60">
              Devis, essais et messages clients de tout le showroom, réunis au même endroit.
            </p>
          </div>

          <div className="mt-10 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: 28 }, (_, i) => (
              <span
                key={i}
                className={i === 19 ? "h-8 w-1.5 rounded-full bg-brand" : "h-8 w-1.5 rounded-full bg-white/15"}
                style={{ height: `${14 + ((i * 37) % 22)}px` }}
              />
            ))}
          </div>
        </section>

        {/* Form */}
        <section className="flex items-center justify-center rounded-3xl bg-card px-6 py-12 shadow-card">
          <div className="w-full max-w-sm animate-scale-in">
            <BrandLogo className="mb-10 h-12 lg:hidden" />
            <p className="eyebrow flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Espace personnel
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-foreground">Bienvenue.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Entrez vos identifiants pour accéder au tableau de bord.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field h-12 pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Saisissez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field h-12 pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-xl bg-[#fbe2da] px-3 py-2 text-sm text-[#9a3415]">
                  {error}
                </p>
              )}

              <Button type="submit" className="h-12 w-full text-[15px]" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <p className="eyebrow mt-12">© {new Date().getFullYear()} Forum Auto</p>
          </div>
        </section>
      </div>
    </div>
  );
}

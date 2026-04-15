import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
            error: authError?.message ?? 'Unknown error',
          },
        });

        setError("Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      // ── 2. Fetch role + brand from the users profile table ────────────────
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, email, role, brand")
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

      // ── 4. Set user in context ────────────────────────────────────────────
      setUser({
        id:    authData.user.id,
        email: authData.user.email ?? email,
        role:  profile.role,
        brand: profile.brand ?? null,
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
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary mb-4">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord Forum</h1>
          <p className="text-muted-foreground mt-2">Connectez-vous à votre espace personnel</p>
        </div>

        <Card className="dashboard-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Bienvenue</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 input-field"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Saisissez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 input-field"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full btn-primary font-medium"
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-red-500 text-center">{error}</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 AutoDealer. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}

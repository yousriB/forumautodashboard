import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 🔹 1. Get user by email only
      const { data: users, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .limit(1);

      if (fetchError) throw fetchError;

      if (!users || users.length === 0) {
        setError("Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      const user = users[0];

      // 🔹 2. Compare password with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        setError("Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      // 🔹 3. Save user info
      setUser({
        id: user.id,
        email: user.email,
        role: user.role,
        brand: user.brand,
      });

      // 🔹 4. Redirect by role
      if (user.role === "support") {
        navigate("/appointments");
      } else if (user.role === "admin") {
        navigate("/dashboard");
      } else if (user.role === "sales") {
        navigate("/devis");
      } else {
        setError("Rôle inconnu. Veuillez contacter l'administrateur.");
      }
    } catch (err: any) {
      console.error(err);
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
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord AutoDealer</h1>
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

              <Button type="submit" className="w-full btn-primary font-medium">
                Se connecter
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-red-500 text-center">
                {error}
              </p>
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
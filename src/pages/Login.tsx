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
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      const user = users[0];

      // 🔹 2. Compare password with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        setError("Invalid email or password");
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
        setError("Unknown role. Contact admin.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong. Please try again.");
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
          <h1 className="text-3xl font-bold text-foreground">AutoDealer Admin</h1>
          <p className="text-muted-foreground mt-2">Sign in to your dashboard</p>
        </div>

        <Card className="dashboard-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@autodealer.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 input-field"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 input-field"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full btn-primary font-medium">
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-red-500">
                {error}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 AutoDealer. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
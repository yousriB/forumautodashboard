import { useBrands } from "@/lib/brands";
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Lock, Mail, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { ROLE_LABELS } from '@/types/user.types';

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  // Local submitting flag — prevents double-submit if the user double-clicks
  // the Update button while the re-auth + updateUser pair is in flight (which
  // would otherwise produce 4 auth calls instead of 2).
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const { labelOf } = useBrands();

  // Profile data now comes from UserContext — no duplicate SELECT on `users`.
  // (The previous version refetched on every `user` reference change, which
  // happened on every TOKEN_REFRESHED event.)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPassword) return;
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      // 1. Re-verify current password via Supabase Auth
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email:    user?.email ?? '',
        password: currentPassword,
      });

      if (reAuthError) {
        setPasswordError('Mot de passe actuel incorrect');
        return;
      }

      // 2. Update password via Supabase Auth (no bcrypt needed — Auth handles hashing)
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setPasswordSuccess('Mot de passe mis à jour');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: 'Succès',
        description: 'Votre mot de passe a été mis à jour.',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError(error instanceof Error ? error.message : 'Impossible de mettre à jour le mot de passe');
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le mot de passe',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">Paramètres</h1>
          <p className="text-muted-foreground mt-2">
            Gérer votre compte et la sécurité
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations du profil
              </CardTitle>
              <CardDescription>
                Les informations de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {user ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role : ''}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email :</span>
                  <span className="text-muted-foreground">{user?.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Rôle :</span>
                  <span className="capitalize text-muted-foreground">
                    {user ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role : ''}
                  </span>
                </div>
                
                {user && user.brands.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{user.brands.length > 1 ? "Marques :" : "Marque :"}</span>
                    <span className="text-muted-foreground">
                      {user.brands.map((b) => labelOf(b)).join(", ")}
                    </span>
                  </div>
                )}
                
                {/* Member-since intentionally removed: the previous version
                    refetched `users` on every UserContext change, which fired
                    a DB request on every TOKEN_REFRESHED event. The created_at
                    field isn't on the context profile, and a static "Member since"
                    line isn't worth the duplicate fetch. If you want it back,
                    add `created_at` to UserContext's User type + select. */}
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Changer le mot de passe
              </CardTitle>
              <CardDescription>
                Mettre à jour le mot de passe de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Saisissez le mot de passe actuel"
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Saisissez le nouveau mot de passe"
                    required
                    minLength={8}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez le nouveau mot de passe"
                    required
                    minLength={8}
                    className="w-full"
                  />
                </div>
                
                {passwordError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{passwordError}</span>
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={isSubmittingPassword}
                  >
                    {isSubmittingPassword ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
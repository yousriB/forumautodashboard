import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Car, Edit } from 'lucide-react';
import { User as UserInterface, roleColors, ROLE_LABELS } from '@/types/user.types';
import { useBrands } from '@/lib/brands';
import { UserForm, UserFormData } from './UserForm';

interface ViewUserDialogProps {
  user: UserInterface | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

interface EditUserDialogProps {
  user: UserInterface | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<UserFormData, 'password'> & { password?: string }) => Promise<void>;
  isSubmitting: boolean;
}

interface DeleteUserDialogProps {
  user: UserInterface | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  isSubmitting: boolean;
}

export const ViewUserDialog = ({ user, open, onOpenChange, onEdit }: ViewUserDialogProps) => {
  const { labelOf } = useBrands();
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Détails de l’utilisateur</DialogTitle>
          <DialogDescription className="text-sm">
            Informations du compte
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
                {user.email}
              </h3>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Rôle</Label>
              <div className="mt-1">
                <Badge className={`${roleColors[user.role]} text-xs sm:text-sm`}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Marques attribuées</Label>
              <div className="mt-1 flex flex-wrap gap-1 text-xs sm:text-sm">
                {user.role !== 'sales' ? (
                  user.role === 'admin' ? 'Toutes les marques' : '—'
                ) : user.brands.length === 0 ? (
                  <span className="text-destructive">Aucune marque</span>
                ) : (
                  user.brands.map((b) => (
                    <Badge key={b} variant="secondary" className="font-medium">
                      <Car className="mr-1 h-3 w-3" />
                      {labelOf(b)}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Créé le</Label>
              <p className="mt-1 text-xs sm:text-sm">
                {new Date(user.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }} 
              className="flex-1 text-sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="text-sm"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const EditUserDialog = ({ user, open, onOpenChange, onSubmit, isSubmitting }: EditUserDialogProps) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {user.id ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {user.id 
              ? 'Rôle, marques attribuées et mot de passe'
              : 'Ajouter un compte'}
          </DialogDescription>
        </DialogHeader>
        <UserForm
          defaultValues={user}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          isEditMode={!!user.id}
        />
      </DialogContent>
    </Dialog>
  );
};

export const DeleteUserDialog = ({ user, open, onOpenChange, onConfirm, isDeleting }: DeleteUserDialogProps) => {
  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le compte <span className="font-semibold">{user.email}</span> sera supprimé définitivement.
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Suppression…
              </span>
            ) : (
              'Supprimer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const CreateUserDialog = ({ open, onOpenChange, onSubmit, isSubmitting }: CreateUserDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Nouvel utilisateur</DialogTitle>
          <DialogDescription className="text-sm">
            Ajouter un compte au tableau de bord
          </DialogDescription>
        </DialogHeader>
        <UserForm
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

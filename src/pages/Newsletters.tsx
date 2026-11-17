import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { queryKeys } from '@/lib/queryKeys';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Mail, Search, Send, Trash2, X } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

type Subscription = {
  id: string;
  email: string;
  created_at: string;
};

const Newsletters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [emailContent, setEmailContent] = useState({
    subject: '',
    message: '',
    isBulk: true
  });
  const { toast } = useToast();

  const {
    data: subscriptions = [],
    isLoading: loading,
    error: queryError,
  } = useQuery<Subscription[]>({
    queryKey: queryKeys.newsletters.all,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .abortSignal(signal);
      if (error) throw error;
      return data ?? [];
    },
  });

  const error = queryError instanceof Error ? queryError.message : null;

  // Delete a subscriber (admins only — newsletter_admin_delete policy).
  // `.select('id')` returns the deleted row, so a refused delete is reported.
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<Subscription | null>(null);
  const deleteMutation = useMutation<void, Error, Subscription>({
    mutationFn: async (subscription) => {
      const { data, error: delErr } = await supabase
        .from('newsletter_subscriptions')
        .delete()
        .eq('id', subscription.id)
        .select('id');
      if (delErr) throw new Error(delErr.message);
      if (!data || data.length === 0) throw new Error('Suppression refusée ou abonné introuvable.');
    },
    onSuccess: (_d, subscription) => {
      queryClient.setQueryData<Subscription[]>(queryKeys.newsletters.all, (old) =>
        (old ?? []).filter((s) => s.id !== subscription.id)
      );
      setSelectedEmails((prev) => prev.filter((e) => e !== subscription.email));
      setPendingDelete(null);
      toast({ title: 'Abonné supprimé', description: subscription.email });
    },
    onError: (err) => {
      toast({ title: 'Suppression impossible', description: err.message, variant: 'destructive' });
    },
  });

  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectEmail = (email: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedEmails(prev => [...prev, email]);
    } else {
      setSelectedEmails(prev => prev.filter(e => e !== email));
    }
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedEmails(filteredSubscriptions.map(sub => sub.email));
    } else {
      setSelectedEmails([]);
    }
  };

  const handleSendEmail = () => {
    if (!emailContent.subject || !emailContent.message) {
      toast({
        title: 'Champs manquants',
        description: 'Veuillez renseigner l\'objet et le message.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const emailsToSend = emailContent.isBulk 
        ? filteredSubscriptions.map(sub => sub.email) 
        : selectedEmails;

      if (emailsToSend.length === 0) {
        throw new Error('Aucun destinataire sélectionné');
      }

      // Encode the subject and body for URL
      const subject = encodeURIComponent(emailContent.subject);
      const body = encodeURIComponent(emailContent.message);
      const bcc = emailsToSend.join(',');
      
      // Open default email client with pre-filled content
      window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
      
      // Reset form and close dialog
      setEmailContent({ subject: '', message: '', isBulk: true });
      setIsDialogOpen(false);
      setSelectedEmails([]);

    } catch (error) {
      console.error('Error preparing email:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de préparer l\'email. Veuillez réessayer.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">Abonnés à la newsletter</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Gérer les abonnés à la newsletter
            </p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2"
            disabled={loading || subscriptions.length === 0}
          >
            <Send className="h-4 w-4" />
            Envoyer la newsletter
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="overflow-hidden rounded-3xl bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-input accent-[#1b1b1a]"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={selectedEmails.length > 0 && selectedEmails.length === filteredSubscriptions.length}
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Inscrit le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Chargement des abonnés…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Aucun abonné ne correspond à la recherche' : 'Aucun abonné pour le moment'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-input accent-[#1b1b1a]"
                        checked={selectedEmails.includes(subscription.email)}
                        onChange={(e) => handleSelectEmail(subscription.email, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {subscription.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(subscription.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Supprimer l'abonné ${subscription.email}`}
                        onClick={() => setPendingDelete(subscription)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <h3 className="text-sm font-medium text-muted-foreground">Total des abonnés</h3>
            <p className="text-2xl font-bold">{subscriptions.length}</p>
          </div>
          <div className="stat-card">
            <h3 className="text-sm font-medium text-muted-foreground">Nouveaux ce mois-ci</h3>
            <p className="text-2xl font-bold">
              {subscriptions.filter(sub => {
                const subDate = new Date(sub.created_at);
                const now = new Date();
                return subDate.getMonth() === now.getMonth() && subDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>

        <ConfirmDeleteDialog
          open={!!pendingDelete}
          onOpenChange={(open) => !open && setPendingDelete(null)}
          title="Supprimer cet abonné ?"
          description={
            pendingDelete && (
              <p>
                <span className="font-medium text-foreground">{pendingDelete.email}</span> sera retiré
                de la liste des abonnés à la newsletter.
              </p>
            )
          }
          isDeleting={deleteMutation.isPending}
          onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
        />

        {/* Send Email Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Envoyer la newsletter</DialogTitle>
              <DialogDescription>
                {`Rédigez votre newsletter pour ${emailContent.isBulk ? `les ${filteredSubscriptions.length} abonnés` : `${selectedEmails.length} abonné(s) sélectionné(s)`}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Objet</Label>
                <Input
                  id="subject"
                  placeholder="Objet de l'email"
                  value={emailContent.subject}
                  onChange={(e) => setEmailContent({...emailContent, subject: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Rédigez le contenu de la newsletter…"
                  className="min-h-[200px]"
                  value={emailContent.message}
                  onChange={(e) => setEmailContent({...emailContent, message: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendToAll"
                  className="h-4 w-4 rounded border-input accent-[#1b1b1a]"
                  checked={emailContent.isBulk}
                  onChange={(e) => setEmailContent({...emailContent, isBulk: e.target.checked})}
                />
                <label
                  htmlFor="sendToAll"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Envoyer aux {filteredSubscriptions.length} abonnés
                </label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  setEmailContent({ subject: '', message: '', isBulk: true });
                }}
                disabled={isSending}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSendEmail}
                disabled={isSending || (!emailContent.isBulk && selectedEmails.length === 0)}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer {emailContent.isBulk ? `à tous (${filteredSubscriptions.length})` : `à la sélection (${selectedEmails.length})`}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Newsletters;
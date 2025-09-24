import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Mail, Search, Send, X } from 'lucide-react';
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [emailContent, setEmailContent] = useState({
    subject: '',
    message: '',
    isBulk: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

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
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const emailsToSend = emailContent.isBulk 
        ? filteredSubscriptions.map(sub => sub.email) 
        : selectedEmails;

      if (emailsToSend.length === 0) {
        throw new Error('No recipients selected');
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
        title: 'Error',
        description: 'Failed to prepare email. Please try again.',
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Newsletter Subscribers</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage your newsletter subscribers
            </p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2"
            disabled={loading || subscriptions.length === 0}
          >
            <Send className="h-4 w-4" />
            Send Newsletter
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={selectedEmails.length > 0 && selectedEmails.length === filteredSubscriptions.length}
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Subscribed On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading subscribers...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No matching subscribers found' : 'No subscribers yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedEmails.includes(subscription.email)}
                        onChange={(e) => handleSelectEmail(subscription.email, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {subscription.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(subscription.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Add action buttons here if needed */}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground">Total Subscribers</h3>
            <p className="text-2xl font-bold">{subscriptions.length}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-muted-foreground">New This Month</h3>
            <p className="text-2xl font-bold">
              {subscriptions.filter(sub => {
                const subDate = new Date(sub.created_at);
                const now = new Date();
                return subDate.getMonth() === now.getMonth() && subDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>

        {/* Send Email Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Send Newsletter</DialogTitle>
              <DialogDescription>
                {`Compose your newsletter to ${emailContent.isBulk ? `all ${filteredSubscriptions.length} subscribers` : `${selectedEmails.length} selected subscribers`}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject"
                  value={emailContent.subject}
                  onChange={(e) => setEmailContent({...emailContent, subject: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Write your newsletter content here..."
                  className="min-h-[200px]"
                  value={emailContent.message}
                  onChange={(e) => setEmailContent({...emailContent, message: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendToAll"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={emailContent.isBulk}
                  onChange={(e) => setEmailContent({...emailContent, isBulk: e.target.checked})}
                />
                <label
                  htmlFor="sendToAll"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Send to all {filteredSubscriptions.length} subscribers
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
                Cancel
              </Button>
              <Button 
                onClick={handleSendEmail}
                disabled={isSending || (!emailContent.isBulk && selectedEmails.length === 0)}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to {emailContent.isBulk ? `All (${filteredSubscriptions.length})` : `Selected (${selectedEmails.length})`}
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
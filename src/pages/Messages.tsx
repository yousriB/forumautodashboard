import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Eye, MessageSquare, Clock, CheckCircle, Mail, Reply, CheckCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Types based on your contact_messages schema
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  status: 'unread' | 'read' | 'responded';
}

const statusColors = {
  unread: "bg-warning text-warning-foreground",
  read: "bg-primary text-primary-foreground",
  responded: "bg-success text-success-foreground",
};

const statusIcons = {
  unread: Clock,
  read: Eye,
  responded: CheckCircle,
};

export default function Messages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const handleRespond = async (messageId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .update({ status: 'responded' })
        .eq('id', messageId);

      if (error) {
        console.error('Error updating message status:', error);
        setError('Failed to update message status');
      } else {
        fetchMessages();
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages from Supabase
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMessages();

    // Optional: Real-time updates
    const channel = supabase
      .channel('contact_messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_messages' },
        (payload) => {
          console.log('Change received!', payload);
          fetchMessages(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  // Filter messages based on search and status
  const filteredMessages = messages.filter((message) => {
    const matchesSearch = 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Mark message as read (optimistic + sync with Supabase)
  const markAsRead = async (messageId: string) => {
    // Optimistic UI update
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId && msg.status === 'unread' 
          ? { ...msg, status: 'read' } 
          : msg
      )
    );

    // Update in Supabase
    const { error } = await supabase
      .from('contact_messages')
      .update({ status: 'read' })
      .eq('id', messageId);

    if (error) {
      console.error('Failed to update message status:', error);
      // Rollback by refetching
      fetchMessages();
    }
  };


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contact Messages</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage customer inquiries and contact requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 text-xs sm:text-sm">
              <MessageSquare className="h-3 w-3" />
              {messages.filter(m => m.status === 'unread').length} Unread
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search messages by name, email, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 input-field"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="dashboard-card py-8 text-center">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        )}

        {error && (
          <div className="dashboard-card py-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchMessages} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && filteredMessages.length === 0 && (
          <div className="dashboard-card py-8 text-center">
            <p className="text-muted-foreground">No messages found.</p>
          </div>
        )}

        {/* Messages Table */}
        {!loading && !error && filteredMessages.length > 0 && (
          <div className="dashboard-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Message Preview</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => {
                    const StatusIcon = statusIcons[message.status];
                    return (
                      <TableRow 
                        key={message.id} 
                        className={`table-row-hover ${message.status === 'unread' ? 'bg-secondary/30' : ''}`}
                      >
                        <TableCell>
                          <div>
                            <div className={`font-medium ${message.status === 'unread' ? 'font-bold' : ''} text-foreground`}>
                              {message.name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{message.email}</span>
                            </div>
                            <div className="md:hidden mt-1">
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {message.message.length > 60 
                                  ? `${message.message.substring(0, 60)}...` 
                                  : message.message
                                }
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="max-w-md">
                            <p className="text-sm text-foreground line-clamp-2">
                              {message.message.length > 100 
                                ? `${message.message.substring(0, 100)}...` 
                                : message.message
                              }
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          <div className="text-sm">
                            <div>{new Date(message.created_at).toLocaleDateString()}</div>
                            <div className="text-xs opacity-75">
                              {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[message.status]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {message.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMessage(message);
                                    if (message.status === 'unread') {
                                      markAsRead(message.id);
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Message from {message.name}</DialogTitle>
                                  <DialogDescription>
                                    Received on {new Date(message.created_at).toLocaleString()}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Mail className="h-4 w-4" />
                                      {message.email}
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-secondary rounded-lg">
                                    <p className="text-foreground whitespace-pre-wrap">{message.message}</p>
                                  </div>

                                  {message.status !== 'responded' && (
                                    <div className="space-y-3">
                                      <div className="flex gap-2">
                                        <Button onClick={() => handleRespond(message.id)} variant="outline">
                                          <CheckCheck className="h-4 w-4 mr-1" />
                                          Respond
                                        </Button>
                                        <Button>
                                          <a href={`mailto:${message.email}`} className="flex items-center gap-1">
                                            <Mail className="h-4 w-4 mr-1" />
                                            Open in Email Client
                                          </a>
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {filteredMessages.length} of {messages.length} messages
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
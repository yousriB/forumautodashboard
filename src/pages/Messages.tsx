import { useState } from "react";
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
import { Search, Filter, Eye, MessageSquare, Clock, CheckCircle, Mail, Reply } from "lucide-react";

// Types based on your contact_messages schema
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  status: 'unread' | 'read' | 'responded';
}

// Sample data - replace with actual API calls
const sampleMessages: ContactMessage[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    message: "I'm interested in the BMW X5 2024. Could you please provide more information about financing options and availability?",
    created_at: "2024-01-15T10:30:00Z",
    status: "unread"
  },
  {
    id: "2",
    name: "Mike Davis",
    email: "mike.davis@email.com",
    message: "Hello, I would like to schedule a test drive for the Mercedes C-Class. I'm available this weekend.",
    created_at: "2024-01-14T14:20:00Z",
    status: "read"
  },
  {
    id: "3",
    name: "Emma Wilson",
    email: "emma.wilson@email.com",
    message: "Do you have any electric vehicles available? I'm particularly interested in Tesla models or similar alternatives.",
    created_at: "2024-01-13T16:45:00Z",
    status: "responded"
  },
  {
    id: "4",
    name: "David Brown",
    email: "david.brown@email.com",
    message: "I received a quote last week but haven't heard back. Could someone please follow up on my request for the Audi A4?",
    created_at: "2024-01-12T09:15:00Z",
    status: "unread"
  },
  {
    id: "5",
    name: "Lisa Chen",
    email: "lisa.chen@email.com",
    message: "Thank you for the excellent service during my recent purchase. I would like to refer my friend who is looking for a family SUV.",
    created_at: "2024-01-11T11:30:00Z",
    status: "read"
  }
];

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
  const [replyText, setReplyText] = useState("");

  const filteredMessages = sampleMessages.filter((message) => {
    const matchesSearch = message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReply = () => {
    if (selectedMessage && replyText.trim()) {
      alert(`Reply sent to ${selectedMessage.email}!`);
      const messageIndex = sampleMessages.findIndex(m => m.id === selectedMessage.id);
      if (messageIndex !== -1) {
        sampleMessages[messageIndex].status = 'responded';
      }
      setReplyText("");
      setSelectedMessage(null);
      window.location.reload();
    }
  };

  const markAsRead = (messageId: string) => {
    const messageIndex = sampleMessages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1 && sampleMessages[messageIndex].status === 'unread') {
      sampleMessages[messageIndex].status = 'read';
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
              {sampleMessages.filter(m => m.status === 'unread').length} Unread
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

        {/* Messages Table */}
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
                                  markAsRead(message.id);
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
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Reply:</label>
                                      <Textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="min-h-[100px]"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button onClick={handleReply} className="flex items-center gap-1">
                                        <Reply className="h-4 w-4" />
                                        Send Reply
                                      </Button>
                                      <Button variant="outline" asChild>
                                        <a href={`mailto:${message.email}`}>
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
              Showing {filteredMessages.length} of {sampleMessages.length} messages
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
      </div>
    </DashboardLayout>
  );
}
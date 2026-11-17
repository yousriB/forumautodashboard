import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  Mail,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { useDebounce } from "@/hooks/useDebounce";
import { queryKeys } from "@/lib/queryKeys";
import { applyChange, uniqueChannelName } from "@/lib/realtimeHelpers";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  status: "unread" | "read" | "responded";
}

const statusColors = {
  unread: "bg-warning text-warning-foreground",
  read: "bg-primary text-primary-foreground",
  responded: "bg-success text-success-foreground",
};

const statusLabels: Record<ContactMessage["status"], string> = {
  unread: "Non lu",
  read: "Lu",
  responded: "Répondu",
};

const statusIcons = {
  unread: Clock,
  read: Eye,
  responded: CheckCircle,
};

async function fetchMessages(signal?: AbortSignal): Promise<ContactMessage[]> {
  let query = supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return (data as ContactMessage[]) ?? [];
}

export default function Messages() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  // Debounce the search input — even though filtering is in-memory today,
  // this keeps re-renders cheap and is the right shape if you ever push
  // search to the server.
  const debouncedSearch = useDebounce(searchTerm, 250);

  const {
    data: messages = [],
    isLoading: loading,
    error: queryError,
  } = useQuery<ContactMessage[]>({
    queryKey: queryKeys.messages.all,
    queryFn: ({ signal }) => fetchMessages(signal),
  });

  const error = queryError instanceof Error ? queryError.message : null;

  // Realtime: patch the cache directly rather than refetching the whole table.
  useEffect(() => {
    const channelName = uniqueChannelName("messages-list");
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        (payload) => {
          queryClient.setQueryData<ContactMessage[]>(
            queryKeys.messages.all,
            (old) => applyChange(old, payload as never)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const respondMutation = useMutation<
    void,
    Error,
    string,
    { previous: ContactMessage[] | undefined }
  >({
    mutationFn: async (messageId) => {
      const { error: updErr } = await supabase
        .from("contact_messages")
        .update({ status: "responded" })
        .eq("id", messageId);
      if (updErr) throw updErr;
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messages.all });
      const previous = queryClient.getQueryData<ContactMessage[]>(queryKeys.messages.all);
      queryClient.setQueryData<ContactMessage[]>(queryKeys.messages.all, (old) =>
        (old ?? []).map((m) => (m.id === messageId ? { ...m, status: "responded" } : m))
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(queryKeys.messages.all, ctx.previous);
    },
  });

  const markAsReadMutation = useMutation<
    void,
    Error,
    string,
    { previous: ContactMessage[] | undefined }
  >({
    mutationFn: async (messageId) => {
      const { error: updErr } = await supabase
        .from("contact_messages")
        .update({ status: "read" })
        .eq("id", messageId);
      if (updErr) throw updErr;
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messages.all });
      const previous = queryClient.getQueryData<ContactMessage[]>(queryKeys.messages.all);
      queryClient.setQueryData<ContactMessage[]>(queryKeys.messages.all, (old) =>
        (old ?? []).map((m) =>
          m.id === messageId && m.status === "unread" ? { ...m, status: "read" } : m
        )
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(queryKeys.messages.all, ctx.previous);
    },
  });

  // Delete (admins only — the contact_admin_delete policy enforces it).
  // `.select("id")` returns the deleted rows, so a refused delete (0 rows)
  // is reported as an error instead of silently "succeeding".
  const { toast } = useToast();
  const { user } = useUser();
  const isAdmin = user?.role === "admin";
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null);

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (messageId) => {
      const { data, error: delErr } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", messageId)
        .select("id");
      if (delErr) throw new Error(delErr.message);
      if (!data || data.length === 0) {
        throw new Error("Suppression refusée ou message introuvable.");
      }
    },
    onSuccess: (_d, messageId) => {
      queryClient.setQueryData<ContactMessage[]>(queryKeys.messages.all, (old) =>
        (old ?? []).filter((m) => m.id !== messageId)
      );
      if (selectedMessage?.id === messageId) setSelectedMessage(null);
      setPendingDelete(null);
      toast({ title: "Message supprimé" });
    },
    onError: (err) => {
      toast({
        title: "Suppression impossible",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleRespond = (messageId: string) => {
    if (respondMutation.isPending) return;
    respondMutation.mutate(messageId);
  };

  const markAsRead = (messageId: string) => {
    if (markAsReadMutation.isPending) return;
    markAsReadMutation.mutate(messageId);
  };

  const filteredMessages = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return messages.filter((message) => {
      const matchesSearch =
        message.name.toLowerCase().includes(q) ||
        message.email.toLowerCase().includes(q) ||
        message.message.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || message.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [messages, debouncedSearch, statusFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">Messages de contact</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Demandes et questions envoyées depuis le site
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 text-xs sm:text-sm">
              <MessageSquare className="h-3 w-3" />
              {messages.filter((m) => m.status === "unread").length} non lu(s)
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email ou contenu…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 input-field"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les messages</SelectItem>
              <SelectItem value="unread">Non lus</SelectItem>
              <SelectItem value="read">Lus</SelectItem>
              <SelectItem value="responded">Répondus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="dashboard-card py-8 text-center">
            <p className="text-muted-foreground">Chargement des messages…</p>
          </div>
        )}

        {error && (
          <div className="dashboard-card py-8 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && filteredMessages.length === 0 && (
          <div className="dashboard-card py-8 text-center">
            <p className="text-muted-foreground">Aucun message trouvé.</p>
          </div>
        )}

        {/* Messages Table */}
        {!loading && !error && filteredMessages.length > 0 && (
          <div className="dashboard-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Aperçu du message</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => {
                    const StatusIcon = statusIcons[message.status];
                    return (
                      <TableRow
                        key={message.id}
                        className={`table-row-hover ${
                          message.status === "unread" ? "bg-secondary/30" : ""
                        }`}
                      >
                        <TableCell>
                          <div>
                            <div
                              className={`font-medium ${
                                message.status === "unread" ? "font-bold" : ""
                              } text-foreground`}
                            >
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
                                  : message.message}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="max-w-md">
                            <p className="text-sm text-foreground line-clamp-2">
                              {message.message.length > 100
                                ? `${message.message.substring(0, 100)}...`
                                : message.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          <div className="text-sm">
                            <div>{new Date(message.created_at).toLocaleDateString("fr-FR")}</div>
                            <div className="text-xs opacity-75">
                              {new Date(message.created_at).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[message.status]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusLabels[message.status] ?? message.status}
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
                                    if (message.status === "unread") {
                                      markAsRead(message.id);
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Message de {message.name}</DialogTitle>
                                  <DialogDescription>
                                    Reçu le {new Date(message.created_at).toLocaleString("fr-FR")}
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
                                    <p className="text-foreground whitespace-pre-wrap">
                                      {message.message}
                                    </p>
                                  </div>

                                  {message.status !== "responded" && (
                                    <div className="space-y-3">
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleRespond(message.id)}
                                          variant="outline"
                                          disabled={respondMutation.isPending}
                                        >
                                          <CheckCheck className="h-4 w-4 mr-1" />
                                          {respondMutation.isPending
                                            ? "Enregistrement…"
                                            : "Marquer comme répondu"}
                                        </Button>
                                        <Button>
                                          <a
                                            href={`mailto:${message.email}`}
                                            className="flex items-center gap-1"
                                          >
                                            <Mail className="h-4 w-4 mr-1" />
                                            Répondre par email
                                          </a>
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                aria-label={`Supprimer le message de ${message.name}`}
                                onClick={() => setPendingDelete(message)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
                {filteredMessages.length} message(s) affiché(s) sur {messages.length}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Précédent
                </Button>
                <Button variant="outline" size="sm">
                  Suivant
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Supprimer ce message ?"
        description={
          pendingDelete && (
            <p>
              Le message de <span className="font-medium text-foreground">{pendingDelete.name}</span>{" "}
              ({pendingDelete.email}) sera supprimé définitivement.
            </p>
          )
        }
        isDeleting={deleteMutation.isPending}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
      />
    </DashboardLayout>
  );
}

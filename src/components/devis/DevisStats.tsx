import React from "react";
import { 
  FileText, 
  X, 
  CheckCircle2, 
  Loader2, 
  DollarSign, 
  Calendar 
} from "lucide-react";
import { DevisRequest } from "@/types/devis";
import { StatsCard } from "@/components/dashboard/StatsCard";

interface DevisStatsProps {
  requests: DevisRequest[];
  className?: string;
}

export const DevisStats: React.FC<DevisStatsProps> = React.memo(
  ({ requests, className }) => {
    const stats = React.useMemo(() => {
      const total = requests.length;
      const pending = requests.filter((req) => req.status === "pending").length;
      const processing = requests.filter(
        (req) => req.status === "processing"
      ).length;
      const completed = requests.filter(
        (req) => req.status === "completed"
      ).length;
      const sold = requests.filter((req) => req.status === "sold").length;
      const rejected = requests.filter(
        (req) => req.status === "rejected"
      ).length;

      return { total, pending, processing, completed, sold, rejected };
    }, [requests]);

    return (
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 ${
          className || ""
        }`}
      >
        <StatsCard
          title="Total demandes"
          value={stats.total}
          icon={FileText}
          description="Selon les filtres"
          tone="stone"
        />
        <StatsCard
          title="Nouveau"
          value={stats.pending}
          icon={Calendar}
          description="À traiter"
          tone="amber"
        />
        <StatsCard
          title="En cours"
          value={stats.processing}
          icon={Loader2}
          description="En traitement"
          tone="stone"
        />
        <StatsCard
          title="Vente confirmée"
          value={stats.sold}
          icon={DollarSign}
          description="Ventes conclues"
          tone="ink"
        />
        <StatsCard
          title="Livré"
          value={stats.completed}
          icon={CheckCircle2}
          description="Véhicules livrés"
          tone="green"
        />
        <StatsCard
          title="Annulé"
          value={stats.rejected}
          icon={X}
          description="Ventes annulées"
          tone="coral"
        />
      </div>
    );
  }
);

DevisStats.displayName = "DevisStats";

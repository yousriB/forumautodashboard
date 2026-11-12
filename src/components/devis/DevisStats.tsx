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
          title="Total Requests"
          value={stats.total}
          icon={FileText}
          description="All time requests"
          tone="stone"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={Calendar}
          description="Awaiting action"
          tone="amber"
        />
        <StatsCard
          title="Processing"
          value={stats.processing}
          icon={Loader2}
          description="In progress"
          tone="stone"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          description="Finished"
          tone="lime"
        />
        <StatsCard
          title="Sold"
          value={stats.sold}
          icon={DollarSign}
          description="Closed deals"
          tone="ink"
        />
        {/* We can omit Rejected or add it if needed, layout fits 5 nicely. 
            If we want 6, grid-cols-3 or similar. 
            Dashboard has 5 cards. Let's stick to 5 or add Rejected as 6th.
            Let's add Rejected as it's important.
        */}
         <StatsCard
          title="Rejected"
          value={stats.rejected}
          icon={X}
          description="Declined"
          tone="coral"
        />
      </div>
    );
  }
);

DevisStats.displayName = "DevisStats";

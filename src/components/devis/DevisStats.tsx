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
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 ${
          className || ""
        }`}
      >
        <StatsCard
          title="Total Requests"
          value={stats.total}
          icon={FileText}
          description="All time requests"
          className="border-l-4 border-l-primary"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={Calendar}
          description="Awaiting action"
          className="border-l-4 border-l-yellow-500"
        />
        <StatsCard
          title="Processing"
          value={stats.processing}
          icon={Loader2}
          description="In progress"
          className="border-l-4 border-l-blue-500"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          description="Finished"
          className="border-l-4 border-l-green-500"
        />
        <StatsCard
          title="Sold"
          value={stats.sold}
          icon={DollarSign}
          description="Closed deals"
          className="border-l-4 border-l-green-700"
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
          className="border-l-4 border-l-red-500"
        />
      </div>
    );
  }
);

DevisStats.displayName = "DevisStats";

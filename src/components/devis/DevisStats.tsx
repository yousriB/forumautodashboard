import React from "react";
import { FileText, X } from "lucide-react";
import { DevisRequest } from "@/types/devis";

interface DevisStatsProps {
  requests: DevisRequest[];
  className?: string;
}

interface StatCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = React.memo(
  ({ title, count, icon, iconColor, iconBg }) => (
    <div className="dashboard-card p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 ${iconBg} rounded-lg`}>
          <div className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {title}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-foreground">
            {count}
          </p>
        </div>
      </div>
    </div>
  )
);

StatCard.displayName = "StatCard";

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
        className={`grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ${
          className || ""
        }`}
      >
        <StatCard
          title="Total Requests"
          count={stats.total}
          icon={<FileText />}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          title="Pending"
          count={stats.pending}
          icon={<FileText />}
          iconColor="text-warning"
          iconBg="bg-warning/10"
        />
        <StatCard
          title="Processing"
          count={stats.processing}
          icon={<FileText />}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          title="Completed"
          count={stats.completed}
          icon={<FileText />}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
        <StatCard
          title="Sold"
          count={stats.sold}
          icon={<FileText />}
          iconColor="text-yellow-500"
          iconBg="bg-yellow-500/10"
        />
        <StatCard
          title="Rejected"
          count={stats.rejected}
          icon={<X />}
          iconColor="text-red-500"
          iconBg="bg-red-500/10"
        />
      </div>
    );
  }
);

DevisStats.displayName = "DevisStats";

import React from "react";
import { Car, Clock, Calendar, CheckCircle } from "lucide-react";
import { TestDriveStats as TestDriveStatsType } from "@/types/testDrive";
import { StatsCard } from "@/components/dashboard/StatsCard";

interface TestDriveStatsProps {
  stats: TestDriveStatsType;
}

export const TestDriveStats = React.memo<TestDriveStatsProps>(({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatsCard title="Total demandes" value={stats.total} icon={Car} description="Tous les test drives" tone="stone" />
      <StatsCard title="En attente" value={stats.pending} icon={Clock} description="En attente de réponse" tone="amber" />
      <StatsCard title="Confirmés" value={stats.confirmed} icon={Calendar} description="Planifiés" tone="ink" />
      <StatsCard title="Effectués" value={stats.completed} icon={CheckCircle} description="Essais réalisés" tone="green" />
    </div>
  );
});

TestDriveStats.displayName = "TestDriveStats";

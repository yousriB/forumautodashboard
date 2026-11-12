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
      <StatsCard title="Total requests" value={stats.total} icon={Car} description="All test drives" tone="stone" />
      <StatsCard title="Pending" value={stats.pending} icon={Clock} description="Awaiting reply" tone="amber" />
      <StatsCard title="Confirmed" value={stats.confirmed} icon={Calendar} description="Booked" tone="ink" />
      <StatsCard title="Completed" value={stats.completed} icon={CheckCircle} description="Driven" tone="green" />
    </div>
  );
});

TestDriveStats.displayName = "TestDriveStats";

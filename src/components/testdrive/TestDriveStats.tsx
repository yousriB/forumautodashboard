import React from "react";
import { Car, Clock, Calendar, CheckCircle } from "lucide-react";
import { TestDriveStats as TestDriveStatsType } from "@/types/testDrive";

interface TestDriveStatsProps {
  stats: TestDriveStatsType;
}

export const TestDriveStats = React.memo<TestDriveStatsProps>(({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="dashboard-card p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
            <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Total Requests
            </p>
            <p className="text-lg sm:text-2xl font-bold text-foreground">
              {stats.total}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-card p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning/10 rounded-lg">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.pending}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-card p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Confirmed</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.confirmed}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-card p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.completed}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

TestDriveStats.displayName = "TestDriveStats";

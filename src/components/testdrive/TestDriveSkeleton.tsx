import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Clock, Calendar, CheckCircle } from "lucide-react";

export const TestDriveSkeleton = React.memo(() => {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
        <div className="flex-1">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="dashboard-card p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-muted rounded-lg">
                {i === 1 && (
                  <Car className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                )}
                {i === 2 && (
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                )}
                {i === 3 && (
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                )}
                {i === 4 && (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-6 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>

      {/* Table Skeleton */}
      <div className="dashboard-card">
        <div className="overflow-x-auto">
          <div className="border rounded-lg">
            {/* Table Header */}
            <div className="border-b p-4">
              <div className="grid grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-4 w-20" />
                ))}
              </div>
            </div>

            {/* Table Rows */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-b p-4 last:border-b-0">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="sm:hidden space-y-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="hidden sm:block space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-28" />
                  <div className="hidden md:block space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-2 w-12" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
});

TestDriveSkeleton.displayName = "TestDriveSkeleton";

// Centralised React Query key factory.
//
// Why this exists:
//   Every query, mutation, and realtime listener references the same cache
//   entries. If keys are spelled inline (`['devis', ...]`) in 12 files, a
//   typo in one file silently breaks invalidation — the symptom is "I saved
//   the form, why is the table still showing the old value". Centralising
//   keys here makes a single rename a one-file change.

import type { DevisType } from "@/types/devis";

export const queryKeys = {
  // Devis (standard + custom unified)
  devis: {
    all: ["devis"] as const,
    list: (
      type: DevisType | "all",
      userRole: string | undefined,
      userBrands: string[] | undefined
    ) => ["devis", type, userRole ?? null, (userBrands ?? []).join("|")] as const,
  },

  // Test drive requests
  testDrives: {
    all: ["testDrives"] as const,
  },

  // Appointments
  appointments: {
    all: ["appointments"] as const,
  },

  // Contact messages
  messages: {
    all: ["messages"] as const,
  },

  // Newsletter subscriptions
  newsletters: {
    all: ["newsletters"] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
  },

  // Brand catalogue
  brands: {
    all: ["brands"] as const,
  },

  // Export & Rapports
  reports: {
    data: (config: string) => ["reports", config] as const,
  },

  // Dashboard RPC stats
  dashboard: {
    monthlyCarStats: (year: string, month: string, brand: string) =>
      ["dashboard", "monthlyCarStats", year, month, brand] as const,
  },
} as const;

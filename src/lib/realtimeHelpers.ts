import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/**
 * Apply a single Postgres-changes payload to an existing array.
 *
 * Old behavior was "any realtime event → full table refetch", which produced
 * a burst of identical SELECTs whenever multiple rows changed in quick
 * succession (e.g. a batch update). Patching the array in place keeps the
 * UI in sync without a second round-trip.
 */
export function applyChange<T extends { id: string }>(
  current: T[] | undefined,
  payload: RealtimePostgresChangesPayload<T>
): T[] {
  const list = current ?? [];
  switch (payload.eventType) {
    case "INSERT": {
      const next = payload.new as T;
      // Guard against the originator's optimistic insert already being there
      if (list.some((r) => r.id === next.id)) return list;
      return [next, ...list];
    }
    case "UPDATE": {
      const next = payload.new as T;
      return list.map((r) => (r.id === next.id ? next : r));
    }
    case "DELETE": {
      const old = payload.old as Partial<T>;
      return list.filter((r) => r.id !== old.id);
    }
    default:
      return list;
  }
}

/**
 * Generate a unique channel name for a list view so two tabs of the same page
 * don't end up sharing a channel (Supabase realtime keys channels by name).
 */
export function uniqueChannelName(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${rand}`;
}

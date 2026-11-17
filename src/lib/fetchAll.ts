// Supabase/PostgREST caps a response at 1000 rows by default, so a plain
// `.select()` silently drops everything after that. fetchAllRows pages
// through the result with `.range()` until a short page comes back.

const PAGE_SIZE = 1000;

// Kept loose on purpose: the builder type changes after every filter call.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RangeableQuery = { range: (from: number, to: number) => any };

export async function fetchAllRows<T>(
  buildQuery: () => RangeableQuery,
  pageSize = PAGE_SIZE
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

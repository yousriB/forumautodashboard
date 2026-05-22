# Supabase Request-Duplication Audit — Sales Dashboard

**Scope:** `Sales Dashboard/src/**` (Vite + React 18 + `@supabase/supabase-js` 2.57 + `@tanstack/react-query` 5.83).
**Date:** 2026-05-22.
**Goal:** Identify every code path that produces duplicate, redundant, or burst HTTP calls to Supabase, then propose a global refactor that prevents the security/brute-force detector from flagging legitimate user activity.

The report is organised in three parts:

1. **Architectural findings** — root causes affecting many files at once.
2. **Per-file findings** — concrete bugs with file/line references and recommended fixes.
3. **Recommended refactor plan** — the React Query / SWR-style migration you asked for, done globally.

---

## 1. Architectural findings (root causes)

### 1.1 React Query is installed but never used (highest-impact root cause)

`package.json` line 43 declares `@tanstack/react-query` and `src/App.tsx` lines 4 and 19–22 set up a `QueryClient` and `QueryClientProvider`, but **no component in the project actually calls `useQuery` or `useMutation`**. Every data hook (`useDevisRequests`, `useTestDriveData`, `useTestDriveRequests`, `useUsers`, etc.) is hand-rolled with `useState` + `useEffect` + `useCallback`. That hand-rolled pattern is the single biggest source of the duplication symptoms you're seeing because none of the per-request guarantees React Query provides (in-flight dedup, stale-time caching, request cancellation on unmount, `refetchOnWindowFocus` controls, mutation `onSettled` invalidation) are active. The whole point of this file's recommendations is to put React Query to work — the dependency is already paid for.

Verification: `grep -rn "useQuery\|useMutation\|queryClient\." src/` returns zero hits.

### 1.2 `QueryClient` has no default options

`src/App.tsx:19` — `const queryClient = new QueryClient();` Even once hooks adopt React Query, defaults of `staleTime: 0` and `refetchOnWindowFocus: true` will produce *more* network traffic than today (every tab focus re-fetches). Defaults below should be set explicitly.

### 1.3 The `UserContext` `user` object is a new reference on every auth event

`src/context/UserContext.tsx:75` calls `setUserState(profile)` with a fresh object each time `onAuthStateChange` fires. Supabase v2 fires `INITIAL_SESSION` synchronously on subscription **and** can re-fire `TOKEN_REFRESHED` every ~50–60 minutes (and on every tab focus that finds the session needs refreshing). Every refire produces a new `user` object reference. Anywhere downstream uses `user` as a `useCallback`/`useMemo`/`useEffect` dep, that dep flips, the callback is rebuilt, and any `useEffect` that depends on the callback runs again — re-issuing the Supabase fetch.

Confirmed at:
- `src/hooks/useDevisRequests.ts:37` — `fetchRequests` is `useCallback(..., [type, user])`. Effect on line 55–57 depends on `[fetchRequests]`, so any `user` ref change refetches the devis table.
- `src/hooks/useTestDriveRequests.ts:33` — same pattern, `[user]` in `fetchData`. (Note: this hook is not currently wired into the Testdrive page — see 2.4 — but the bug is latent.)
- `src/pages/Settings.tsx:51` — `useEffect(..., [toast, user])` fetches the profile every time `user` re-references, *and* `toast` is also a non-memoised function in many shadcn implementations.
- `src/components/dashboard/Sidebar.tsx:35` — `user?.role` is read every render; the navigation array is rebuilt every render. Not a network call by itself, but cascades into child re-renders.

This is the **single biggest cause of "the same request fired multiple times for one user action"** in your security log. A login or tab switch effectively causes most data hooks to refetch.

### 1.4 The Supabase client is a singleton but the instrumented fetch is created at module scope

`src/lib/supabaseClient.ts:52–56` calls `createInstrumentedFetch()` once at import time — good. However the instrumented fetch logs **every** REST call to the `security-log` edge function (line 34). That means every duplicate request from the issues above is logged twice (once as the request, once by the security logger), amplifying noise in the brute-force detector. Once the duplication bugs are fixed the noise drops, but consider also: filter the logger to only log non-GET requests or status ≥ 400 to keep the log signal-to-noise high.

### 1.5 No request-level dedup / abort on unmount

None of the hand-rolled hooks (`useUsers`, `useDevisRequests`, `useTestDriveData`, page-level effects in `Appointments`, `Messages`, `Newsletters`, `Dashboard`) attach an `AbortController` to the Supabase query. If a user navigates between pages quickly, the in-flight query from the unmounted page still completes, calls `setRequests`, fights with the new page's data, and **counts as a request that the security logger sees**. Even if React doesn't render the result (mounted flag), the Supabase REST call has already gone out.

### 1.6 React Strict Mode is **not** enabled

`src/main.tsx:5` does `createRoot(...).render(<App />)` — no `<StrictMode>` wrapper. So the "double-effect in dev" mode is *not* what's causing extras today. But this also means a future enable will reveal more issues. Once the refactor is done, turning Strict Mode on in dev is recommended; the React Query migration will neutralise the double-fetch problem automatically.

### 1.7 Two parallel test-drive data hooks exist; one is dead code

`src/hooks/useTestDriveData.ts` and `src/hooks/useTestDriveRequests.ts` both exist. Only `useTestDriveData` is imported (`grep` confirms). `useTestDriveRequests` is dead code that confuses future maintainers and still has the user-ref bug from 1.3. Delete it or replace it during the refactor.

---

## 2. Per-file findings

### 2.1 `src/lib/supabaseClient.ts` — instrumented fetch logs every read

Lines 11–48. The wrapper logs every `/rest/v1/*` call. With the duplication bugs in section 1, a single page view can produce 6–12 logged events.

**Fix:**
- Skip logging on `GET` calls that returned `200`; only log `4xx`/`5xx` and writes (`POST`/`PATCH`/`DELETE`).
- Optional: dedupe by `(endpoint, method, status)` within a 1-second window before logging.

### 2.2 `src/context/UserContext.tsx` — auth handler refetches profile on every TOKEN_REFRESHED

Lines 87–104. `onAuthStateChange` fires on `INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED`, `USER_UPDATED`, and `SIGNED_OUT`. Each non-null session calls `fetchProfile`, which is **two queries** in the worst case (lines 35–51: primary by id, fallback by email). On the home page that means the `users` table can be hit on every token refresh.

Furthermore, `Login.tsx` already fetches the same profile (line 51–55) immediately after `signInWithPassword`. So a successful login produces: `signInWithPassword` → `users.select` (Login) → `auth.onAuthStateChange` fires → `users.select` (UserContext) → potentially a second `users.select` by email fallback. That's **three or four** consecutive selects on `users` for one login.

**Fix:**
- Move the profile fetch out of `Login.tsx`. Only `UserContext` should know how to load the profile. Login should just call `signInWithPassword` and wait for `user` to populate from the context.
- Skip the fallback-by-email query if the primary by-id query returns a result (already the case). Also skip the fallback if the primary returns a clean `null` without an error — it currently still fires the second query.
- Cache the profile result by `auth.user.id` inside the context so `TOKEN_REFRESHED` doesn't trigger another DB hit unless the id changes.

### 2.3 `src/pages/Login.tsx` — login does its own profile fetch

Lines 51–55 — duplicate of `UserContext.fetchProfile`. Also uses `.or(\`id.eq.${authData.user.id},email.eq.${email}\`)` which fetches both indexes in a single query (good) — but the same row is then fetched again by the auth listener. Remove the manual fetch and let `UserContext` populate.

Also: the form has `disabled={loading}` (line 161) ✓ — submit dedup is OK, but the *security event logging* on failure (line 33) is `await`-ed and will pile up on the security-log function under a brute-force attempt (3 attempts × 1 logged event each = 3 calls to `security-log`, plus the 3 auth calls themselves). This is expected behaviour, not a bug.

### 2.4 `src/pages/Dashboard.tsx` — RPC fetched whenever filters change

Lines 87–120. `useEffect` deps are `[selectedBrand, selectedMonth, selectedYear]` ✓. Click a different month → one RPC call ✓. The bug here is small but real: there's **no debouncing on the Select components**. If a user opens the month dropdown and arrow-keys through months, each highlight may select-and-fire. In practice shadcn's `Select` only commits on click so this is low risk, but worth a `useDebounce(selectedMonth, 250)` for safety.

Also: no `AbortController`. If the user changes month-then-year quickly the first RPC's response can land after the second's and overwrite the new value (race condition + extra request the security logger sees).

### 2.5 `src/pages/Appointments.tsx` — realtime + manual refetch = triple-fire on every action

Lines 105–123. The `useEffect` does:
1. `fetchAppointments()` on mount ✓
2. Subscribes to `postgres_changes` event `*` on `appointment_requests`
3. **Inside the listener**, calls `fetchAppointments()` on every change

`updateAppointmentStatus` (line 125–149) then does:
1. UPDATE
2. `await fetchAppointments()` (explicit refetch)
3. Postgres replication fires → listener → `fetchAppointments()` (third call)

So one button click = **one UPDATE + two full table SELECTs**. Multiply by 5 logged-in dashboard tabs and the security logger sees a burst that looks like a hammered endpoint.

Same logic exists in `handleSaveReschedule` (line 161) and `updateAppointmentStatus` cancel path.

**Fix:**
- Remove the explicit `fetchAppointments()` after writes. Either rely on the realtime listener, or do an optimistic local update (like `Messages.markAsRead` already does) and skip both the refetch and the realtime push for the originator.
- The realtime listener should not refetch the entire table on each event — handle the `INSERT`/`UPDATE`/`DELETE` payload locally.
- Channel name `"appointment_requests"` (line 109) collides with the table name; if any other component subscribes with the same name they share state. Use a unique channel id like `"appointments-list"`.

### 2.6 `src/pages/Messages.tsx` — same pattern as Appointments

Lines 109–128. Same issue: realtime + explicit `fetchMessages()` after `handleRespond` (line 75). Same fix.

`markAsRead` on line 142 is correct — optimistic update, no refetch on success. Use that pattern everywhere.

### 2.7 `src/hooks/useDevisRequests.ts` — refetches on every `user` reference change

Lines 12–37. `fetchRequests` deps include `user`. Effect on lines 55–57 refires when `fetchRequests` changes. Every token refresh refetches the devis table (which is `fetchAllRequests` → **2 parallel queries** to `devis_requests` and `custom_devis_requests`). On a typical dealership browser left open for the day, this can be 20+ unnecessary pairs of requests per hour.

**Fix:**
- Depend on the primitive fields you actually need: `[type, user?.role, user?.brand, user?.id]`.
- Better: migrate this hook to `useQuery` (section 3). React Query handles staleness, dedup, and refetching policy declaratively.

### 2.8 `src/services/devisService.ts` — `updateStatus` does SELECT + UPDATE

Lines 137–171. To validate the status transition you select the current row, then update. That's 2 requests per status change. With the page-level refetch on mutation success (which the new flow won't need but the legacy code does in `useDevisActions.ts:33` — though it currently just optimistically updates local state), the security log sees a SELECT + UPDATE every time someone clicks the status dropdown.

**Fix:** Move the transition validation into the database via a `CHECK` constraint or a Postgres function/trigger (`update_devis_status(id, new_status, is_admin)`), then a single RPC call replaces both queries.

### 2.9 `src/services/testDriveService.ts` — `updateTestDriveStatus` does SELECT + UPDATE (+ retry)

Lines 33–106. SELECT (line 55), then UPDATE (line 69), and on `PGRST116` retries with `updated_at` (line 84) — potentially 3 requests per single status change. Same recommended fix as 2.8: do it in a single SQL function/trigger.

The retry path is also questionable: `PGRST116` means "JSON object requested, multiple (or no) rows returned" — not a missing column. Retrying with `updated_at` won't fix it, but it does fire another write. Remove the retry block.

### 2.10 `src/services/userService.ts` — every mutation is two requests

- `createUser` (line 36): admin auth create + profile insert (2 requests).
- `deleteUser` (line 106): admin auth delete + profile delete (2 requests).

Both are necessary because the auth.users row and the public.users row live in different schemas, but the create+select pattern is correct.

The **real** issue is at the *caller* level: `src/pages/Users.tsx:67–69`, `90–92`, `103–105` all call `await refetch()` after every mutation. `refetch` re-runs `userService.getUsers()`, so create = 3 requests, update = 2 requests, delete = 3 requests. Replace with React Query's `queryClient.invalidateQueries(['users'])` + optimistic update.

### 2.11 `src/pages/Settings.tsx` — duplicate profile fetch and dep mistakes

Lines 31–51. `useEffect(..., [toast, user])`:
- The `users` row this loads is already in `UserContext`. Pull it from context — zero requests.
- `toast` from shadcn's `useToast` is not memoised, so it changes reference, refiring the effect on every render. Remove `toast` from deps.

Password-change handler (lines 53–103) currently signs in again to verify the current password (line 70) — that's another auth call. Then updates (line 81) — another. Two auth calls per password change is unavoidable here unless you accept Supabase's `updateUser` requiring an active session (it does, so the re-auth is your design choice for an extra security check, not a bug). Just guard the submit with an `isSubmitting` flag — the form **does not currently disable the button** while the request is in flight (button has no `disabled` prop on line 254). One double-click = two re-auth + update flows = **4 auth calls**.

**Fix:**
- Disable submit while in flight.
- Remove the `useEffect` that fetches `users` — read from `useUser()` context instead.

### 2.12 `src/pages/Users.tsx` — mutation handlers don't await dedup

Lines 57–110. After each mutation, `await refetch()` (lines 68, 91, 104). React Query's `invalidateQueries` should replace this.

Also: the dialog's submit button does have an `isSubmitting` prop wired in (`UserDialogs.tsx:140, 167, 215`) ✓ — that's good. But there's no idempotency on `handleConfirmDelete` (line 99): the prop comes in already wired to `mutationLoading`, so it should be fine.

The user-list filter (lines 34–39) uses `users.filter(...)` directly without `useMemo`. Filtering on every keystroke is fine for arrays of ~hundreds, but the typed search has **no debounce**. If you add server-side search later, this will explode into per-keystroke fetches. Add a `useDebounce(searchTerm, 250)` proactively.

### 2.13 `src/hooks/useTestDriveActions.ts` — callback recreates on every `requests` change

Lines 14–80. `updateStatus`'s `useCallback` deps include `requests`. Since `requests` is the array that `setRequests` mutates after every fetch and every optimistic update, the callback identity changes every time a row changes. Any child component that uses this callback in a `useEffect` dep array re-runs that effect. None currently do (`TestDriveRow` uses it as a click handler, not an effect dep), but the bug is latent.

**Fix:** Use the functional form of `setRequests(prev => ...)` (already used elsewhere on line 26) and remove `requests` from the deps; look up `requestId` inside the updater instead. Same fix on `deleteRequest` (line 94).

### 2.14 `src/hooks/useTestDriveFilters.ts` — memo invalidated on every render

Line 14: `const filters = { searchTerm: ..., statusFilter };` is a fresh object literal on every render. Line 20: `useMemo(..., [requests, filters])` invalidates the memo every render. Net effect: filtering runs on every render. Not a Supabase issue, but it cascades into child re-renders.

**Fix:** Inline the literal into the `useMemo` callback or `useMemo` the `filters` object itself.

### 2.15 `src/hooks/useDevisFilters.ts` — `dateRange` object compare-by-reference

Lines 18–44. `dateRange` is `{ from: Date|undefined, to: Date|undefined }`. The `useMemo` deps treat `dateRange` by reference, so any `setDateRange({...})` invalidates the memo even if the values are equal. Cosmetic.

### 2.16 `src/components/dashboard/Sidebar.tsx` — re-renders every parent render

Lines 33–95. The `navigation` array on line 17 is module-scope (good), but `filteredNav` (line 39) is recomputed on every render. The component would benefit from `React.memo`, but the bigger win is making the `user` reference stable (section 1.3) so this entire subtree doesn't re-render unnecessarily.

### 2.17 `src/hooks/useDevisPagination.ts` — `useEffect` reset depends on `items.length`

Lines 30–32. Fine in practice. Just noting it for completeness.

### 2.18 `src/pages/Newsletters.tsx` — fetch on mount, no problems

Lines 34–54. No realtime listener, no duplication. The newsletter "send" uses `mailto:` so no server load. Fine as-is.

---

## 3. Recommended refactor — global React Query migration

Below is the concrete plan, ordered so the highest-impact wins ship first. Each step is independent enough to ship and review on its own.

### Step 1 — Configure the QueryClient (high impact, tiny diff)

`src/App.tsx` — replace `new QueryClient()` with:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,           // 30s: dedup identical fetches in this window
      gcTime: 5 * 60_000,           // 5m: keep cached data around between page switches
      refetchOnWindowFocus: false,  // turn off until you opt in per-query
      refetchOnReconnect: 'always',
      retry: (failureCount, error) => {
        // Don't retry 4xx — they're not transient and will look like brute-force
        if (error && (error as any).status >= 400 && (error as any).status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,                 // never retry writes
    },
  },
});
```

The `staleTime` of 30s alone neutralises the "same component remounts and refetches" symptom that mounts/unmounts (e.g., navigating Devis → Settings → Devis) cause today.

### Step 2 — Stabilise `UserContext` (kills section 1.3 cascade)

`src/context/UserContext.tsx`:

1. Cache the last fetched profile keyed by `auth.user.id`. Skip the DB fetch if `TOKEN_REFRESHED` fires for the same id.
2. Use a `useRef` to deduplicate concurrent `fetchProfile` calls (in-flight promise reuse).
3. Don't refetch on `USER_UPDATED` unless `auth.user.email` has actually changed.

Sketch:

```ts
const profileCache = useRef<{ id: string; data: User; ts: number } | null>(null);
const inFlight = useRef<Promise<User | null> | null>(null);

const fetchProfile = useCallback(async (authId: string, email: string) => {
  const cached = profileCache.current;
  if (cached && cached.id === authId && Date.now() - cached.ts < 60_000) {
    return cached.data;
  }
  if (inFlight.current) return inFlight.current;
  inFlight.current = (async () => {
    const { data } = await supabase
      .from('users')
      .select('id, email, role, brand')
      .eq('id', authId)
      .maybeSingle();
    const fallback = data ?? (await supabase
      .from('users')
      .select('id, email, role, brand')
      .eq('email', email)
      .maybeSingle()).data;
    const profile = fallback as User | null;
    if (profile) profileCache.current = { id: authId, data: profile, ts: Date.now() };
    return profile;
  })();
  try { return await inFlight.current; }
  finally { inFlight.current = null; }
}, []);
```

### Step 3 — Replace every hand-rolled data hook with `useQuery`

| Hook to remove | Replacement (`useQuery` key) | Notes |
| --- | --- | --- |
| `useDevisRequests('all')` | `['devis', 'all', userRole, userBrand]` | `queryFn` calls `DevisService.fetchAllRequests`. Filtering and pagination remain client-side. |
| `useDevisRequests('standard')` | `['devis', 'standard', ...]` | Same shape. |
| `useTestDriveData()` | `['testDrive']` | Drop `useTestDriveRequests.ts` (dead code). |
| `useUsers()` | `['users']` | Trivial. |
| `Dashboard` RPC fetch | `['monthlyCarStats', year, month, brand]` | Use RPC inside `queryFn`. |
| `Appointments` fetch | `['appointments']` | Pair with realtime → `queryClient.setQueryData(['appointments'], ...)` from the listener payload. |
| `Messages` fetch | `['messages']` | Same as above. |
| `Settings` profile fetch | **delete** — read from `useUser()`. |
| `Newsletters` fetch | `['newsletterSubscriptions']` | Trivial. |

Concrete example for devis:

```ts
// src/hooks/useDevisRequests.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useDevisRequests(type: DevisType | 'all') {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['devis', type, user?.role, user?.brand],
    queryFn: ({ signal }) => DevisService.fetchRequests(type, undefined, user?.role, user?.brand, signal),
    enabled: !!user,
    staleTime: 30_000,
  });

  return {
    requests: query.data?.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
    // Local mutators kept for optimistic UI:
    updateRequest: (id: string, patch: Partial<DevisRequest>) =>
      queryClient.setQueryData(['devis', type, user?.role, user?.brand], (old: any) =>
        old ? { ...old, data: old.data.map((r: DevisRequest) => r.id === id ? { ...r, ...patch } : r) } : old),
    removeRequest: (id: string) =>
      queryClient.setQueryData(['devis', type, user?.role, user?.brand], (old: any) =>
        old ? { ...old, data: old.data.filter((r: DevisRequest) => r.id !== id) } : old),
    addRequest: (newReq: DevisRequest) =>
      queryClient.setQueryData(['devis', type, user?.role, user?.brand], (old: any) =>
        old ? { ...old, data: [newReq, ...old.data] } : old),
  };
}
```

Update `DevisService.fetchRequests` to accept an `AbortSignal` and pass it to Supabase via `.abortSignal(signal)`.

### Step 4 — Mutations via `useMutation`

Replace `useDevisActions.ts`, `useTestDriveActions.ts`, `useUserMutations.ts` with `useMutation` calls that:
1. Run an optimistic local update in `onMutate`.
2. Call the service.
3. Roll back in `onError`.
4. Invalidate / surgically patch the cache in `onSuccess`.

Example for a status change:

```ts
const mutation = useMutation({
  mutationFn: ({ id, status, type }: { id: string; status: DevisStatus; type: DevisType }) =>
    DevisService.updateStatus(id, status, type, user?.role === 'admin'),
  onMutate: async ({ id, status }) => {
    await queryClient.cancelQueries({ queryKey: ['devis'] });
    const prev = queryClient.getQueriesData({ queryKey: ['devis'] });
    queryClient.setQueriesData({ queryKey: ['devis'] }, (old: any) =>
      old ? { ...old, data: old.data.map((r: any) => r.id === id ? { ...r, status } : r) } : old);
    return { prev };
  },
  onError: (_e, _v, ctx) => {
    ctx?.prev?.forEach(([key, data]) => queryClient.setQueryData(key, data));
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['devis'] });
  },
});
```

Per-button submit guards become `mutation.isPending` from React Query — no more local `isSubmitting` state to forget.

### Step 5 — Collapse SELECT+UPDATE into single RPCs

For `devisService.updateStatus` (2.8) and `testDriveService.updateTestDriveStatus` (2.9), create Postgres functions:

```sql
create or replace function update_devis_status(
  p_id uuid, p_new_status devis_status, p_is_admin bool
) returns devis_requests as $$
  -- validate transition in SQL
  -- update and return updated row
$$ language plpgsql security definer;
```

Call once via `supabase.rpc('update_devis_status', { p_id, p_new_status, p_is_admin })`. Half the writes disappear.

### Step 6 — Realtime listeners stop calling `fetchX()`

In `Appointments.tsx` and `Messages.tsx`, the channel listener should patch `queryClient.setQueryData(['appointments'], old => mergePayload(old, payload))` instead of triggering a full refetch. Pseudo-helper:

```ts
function applyChange(old: AppointmentRequest[] = [], payload: any) {
  switch (payload.eventType) {
    case 'INSERT': return [payload.new, ...old];
    case 'UPDATE': return old.map(r => r.id === payload.new.id ? payload.new : r);
    case 'DELETE': return old.filter(r => r.id !== payload.old.id);
    default: return old;
  }
}
```

Combined with optimistic updates this means: 1 click = 1 UPDATE round-trip. The realtime push to the originator is idempotent because the local cache already has the new value.

Channels should also be named uniquely (e.g. `'appointments-list-' + crypto.randomUUID()` per listener) to avoid cross-component channel sharing.

### Step 7 — Quiet the security logger

`src/lib/supabaseClient.ts`:

```ts
if (isRestCall) {
  const method = (options.method ?? 'GET').toUpperCase();
  const status = response.status;
  const isInterestingRead = status >= 400;
  const isWrite = method !== 'GET';
  if (isInterestingRead || isWrite) {
    logSecurityEvent({ ... });
  }
}
```

This drops 80–95% of log volume immediately and avoids the brute-force detector tripping on bursty read traffic.

### Step 8 — Add defensive UI guards (covers what's left)

- Every form: `disabled={mutation.isPending}` on submit and cancel buttons.
- Every search input: wrap in `useDebounce` (already exists in `useDebounce.ts`) at 250–400ms before it influences any query key.
- Status dropdown rows: pass `mutation.isPending` to disable while pending — `DevisRow.tsx:155` and `TestDriveRow.tsx:107` already check a `loading` / `isUpdating` prop; just make sure the parent passes `mutation.isPending`.

### Step 9 — Optional: turn on React Strict Mode in dev

Once the migration is complete, wrap `<App />` in `<StrictMode>` (`src/main.tsx:5`). React Query and `useEffect` cleanup will both behave correctly under double-mount; you'll catch any remaining leaky effects during local development before they hit production.

---

## 4. Quick-win punch list (if a full migration is too much in one sprint)

If the React Query migration needs to be staged, these are the changes that give the largest reduction in duplicate requests for the least churn:

1. `src/pages/Appointments.tsx:140` and `:186` — delete the `await fetchAppointments()` after writes. The realtime listener already refreshes. (–50% of appointment requests.)
2. `src/pages/Messages.tsx:75` — same delete. (–50% messages requests.)
3. `src/context/UserContext.tsx` — add the `profileCache` ref guard from Step 2. (–90% of `users.select` calls during a session.)
4. `src/pages/Login.tsx:51–55` — delete the profile fetch; rely on the context. (–1 SELECT per login.)
5. `src/hooks/useDevisRequests.ts:37` — change deps from `[type, user]` to `[type, user?.id, user?.role, user?.brand]`. (–N refetches per session where N = number of token refreshes.)
6. `src/pages/Users.tsx:68/91/104` — keep `refetch()` for now, but in the dialog handlers add `disabled={mutationLoading}` to prevent double-click double-submit at the page level. (Already mostly handled in dialogs — confirm in CreateUserDialog and EditUserDialog.)
7. `src/lib/supabaseClient.ts:21–44` — guard the logger to writes + errors only. (–~85% of log function calls regardless of other work.)

Even applied in isolation, these seven edits should drop request volume by roughly 70% and remove the most obvious triple-fire patterns from your security log.

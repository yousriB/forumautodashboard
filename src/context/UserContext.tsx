// context/UserContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  role: "admin" | "support" | "sales" | string;
  /** Legacy single brand (mirror of the first assigned brand). */
  brand?: string | null;
  /** Brands this account may access (sales). Empty for admin/support. */
  brands: string[];
}

type ProfileRow = {
  id: string;
  email: string;
  role: string;
  brand: string | null;
  user_brands?: { brand: string }[] | null;
};

const toUser = (row: ProfileRow | null): User | null =>
  row
    ? {
        id: row.id,
        email: row.email,
        role: row.role,
        brand: row.brand,
        brands: (row.user_brands ?? []).map((b) => b.brand).sort(),
      }
    : null;

interface UserContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | undefined>(undefined);

// Cache profile fetches for 60s. TOKEN_REFRESHED can fire every ~50 minutes
// (and on every tab focus that finds the session needs refreshing); without this
// cache, every refresh produces another SELECT on public.users.
const PROFILE_CACHE_TTL_MS = 60_000;

// ─── Provider ─────────────────────────────────────────────────────────────────

export type { User as SessionUser };

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cache the last successful profile fetch by auth id.
  const profileCache = useRef<{ id: string; data: User; ts: number } | null>(null);
  // Dedup concurrent fetchProfile calls (in-flight promise reuse).
  const inFlightRef = useRef<Promise<User | null> | null>(null);

  // ── Fetch role + brand from the profile table ─────────────────────────────
  const fetchProfile = useCallback(
    async (authId: string, email: string): Promise<User | null> => {
      // Cache hit — skip the network entirely.
      const cached = profileCache.current;
      if (cached && cached.id === authId && Date.now() - cached.ts < PROFILE_CACHE_TTL_MS) {
        return cached.data;
      }

      // In-flight dedup — if another call started fetching the same profile,
      // wait on its promise instead of starting a second request.
      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      inFlightRef.current = (async () => {
        // Primary lookup by auth ID
        const { data, error } = await supabase
          .from("users")
          .select("id, email, role, brand, user_brands(brand)")
          .eq("id", authId)
          .maybeSingle();

        if (error) console.error("[UserContext] fetchProfile error:", error.message);

        let profile = toUser(data as ProfileRow | null);

        // Fallback: match by email (handles legacy rows where id ≠ auth id).
        // Only run the fallback if the primary lookup returned NO row AND no
        // database error — both empty result + DB error were producing a second
        // request before.
        if (!profile && !error) {
          const { data: byEmail } = await supabase
            .from("users")
            .select("id, email, role, brand, user_brands(brand)")
            .eq("email", email)
            .maybeSingle();
          profile = toUser(byEmail as ProfileRow | null);
        }

        if (profile) {
          profileCache.current = { id: authId, data: profile, ts: Date.now() };
        }
        return profile;
      })();

      try {
        return await inFlightRef.current;
      } finally {
        inFlightRef.current = null;
      }
    },
    []
  );

  // ── Core auth-state handler ───────────────────────────────────────────────
  const handleAuthChange = useCallback(
    async (session: Session | null) => {
      try {
        if (!session?.user) {
          profileCache.current = null;
          setUserState(null);
          return;
        }

        // If the auth id matches what's already in state AND the cache is
        // fresh, skip the fetch entirely. This is what kills the
        // refetch-on-every-token-refresh storm.
        const current = profileCache.current;
        if (current && current.id === session.user.id) {
          setUserState((prev) => prev ?? current.data);
          return;
        }

        const profile = await fetchProfile(session.user.id, session.user.email ?? "");
        setUserState(profile);
      } catch (error) {
        console.error("[UserContext] handleAuthChange error:", error);
        setUserState(null);
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile]
  );

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      // Defer async work outside Supabase's callback context (Supabase v2's
      // onAuthStateChange does NOT await async callbacks; running async work
      // directly in the callback can race the next event).
      setTimeout(() => {
        if (mounted) handleAuthChange(session);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthChange]);

  // ── setUser: used by Login.tsx to set the user after sign-in ─────────────
  const setUser = useCallback((userData: User | null) => {
    if (userData) {
      profileCache.current = { id: userData.id, data: userData, ts: Date.now() };
    } else {
      profileCache.current = null;
    }
    setUserState(userData);
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    profileCache.current = null;
    await supabase.auth.signOut();
    setUserState(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

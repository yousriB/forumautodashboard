// context/UserContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  role: "admin" | "support" | "sales" | string;
  brand?: string | null;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch role + brand from the profile table ─────────────────────────────
  const fetchProfile = async (authId: string, email: string): Promise<User | null> => {
    // Primary lookup by auth ID
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, brand")
      .eq("id", authId)
      .maybeSingle();

    if (error) console.error("[UserContext] fetchProfile error:", error.message);
    if (data) return data as User;

    // Fallback: match by email (handles legacy rows where id ≠ auth id)
    const { data: byEmail } = await supabase
      .from("users")
      .select("id, email, role, brand")
      .eq("email", email)
      .maybeSingle();

    return (byEmail as User) ?? null;
  };

  // ── Core auth-state handler (async, with full error safety) ──────────────
  //
  // WHY setTimeout(0):
  //   Supabase's onAuthStateChange does NOT await async callbacks.
  //   If we put async work directly in the callback, Supabase fires the next
  //   event before the previous one finishes → race conditions.
  //   Deferring to the next tick (setTimeout 0) moves the async work out of
  //   Supabase's internal callback context entirely, making it safe.
  //
  // WHY no separate init() / getSession():
  //   Supabase v2 fires INITIAL_SESSION synchronously when the listener is
  //   registered, covering the "restore on mount" case automatically.
  //   Having both init() AND onAuthStateChange causes them to run concurrently
  //   and race each other on every page load.
  const handleAuthChange = async (session: Session | null) => {
    try {
      if (!session?.user) {
        setUserState(null);
        return;
      }

      const profile = await fetchProfile(session.user.id, session.user.email ?? "");
      setUserState(profile);
    } catch (error) {
      // Even on unexpected errors, clear the user so the app never gets stuck
      console.error("[UserContext] handleAuthChange error:", error);
      setUserState(null);
    } finally {
      // ALWAYS unset loading — this is the only place it needs to happen
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        // Defer async work outside Supabase's callback context (see note above)
        setTimeout(() => {
          if (mounted) handleAuthChange(session);
        }, 0);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── setUser: used by Login.tsx to set the user after sign-in ─────────────
  const setUser = (userData: User | null) => {
    setUserState(userData);
  };

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will fire SIGNED_OUT → handleAuthChange(null) → clears user
    // but we also clear immediately for instant UI response
    setUserState(null);
  };

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

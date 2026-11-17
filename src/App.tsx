import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import NotFound from "./pages/NotFound";
import Testdrive from "./pages/Testdrive";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Devis from "./pages/Devis";
import Newsletters from "./pages/Newsletters";
import Exports from "./pages/Exports";

// QueryClient with sensible defaults for a low-write, multi-tab dashboard.
//   - staleTime: dedup repeated reads within a 30s window so navigation
//     between pages doesn't re-fetch every dataset.
//   - gcTime: keep cached data around for 5 minutes so back/forward feels instant.
//   - refetchOnWindowFocus: OFF globally; opt in per-query if you want it.
//   - retry: never retry 4xx (they aren't transient and look like brute-force
//     attempts to the security log); at most 1 retry for 5xx/network errors.
//   - mutations: never auto-retry; the user must explicitly resubmit.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes - wrap with ProtectedRoute */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/testdrive" element={<Testdrive />} />
              <Route path="/devis" element={<Devis />} />
              <Route path="/newsletters" element={<Newsletters />} />
              <Route path="/exports" element={<Exports />} />
            </Route>
            
            {/* 404 - Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

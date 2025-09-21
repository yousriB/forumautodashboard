// context/UserContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define user shape
interface User {
  id: string;
  email: string;
  role: "admin" | "support" | "sales" | string;
  brand?: string; // <-- Add brand for sales users
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Key for localStorage
const USER_STORAGE_KEY = "forumwebapp_user";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, []);

  // Update localStorage when user changes
  const setUser = (userData: User | null) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

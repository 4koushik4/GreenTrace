/**
 * Unified Authentication Hook
 * Provides Supabase authentication with a clean interface for the app
 */

import React, { useState, useEffect, useContext, createContext } from "react";
import { useAuth as useSupabaseAuth, UserProfile, supabase as supabaseClient } from "./supabase";

// Extended user interface for authentication
export interface UnifiedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  points: number;
  level: string;
  wasteClassified: number;
  joinedDate: string;
  ecoScore: number;
  badges: string[];
  preferences: {
    darkMode: boolean;
    notifications: boolean;
    language: string;
  };
  source: "mock" | "supabase";
}

interface UnifiedAuthContextType {
  user: UnifiedUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UnifiedUser>) => Promise<void>;
  isSupabaseConnected: boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(
  undefined,
);

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error("useUnifiedAuth must be used within a UnifiedAuthProvider");
  }
  return context;
};

// Helper function to convert Supabase user to UnifiedUser
const convertSupabaseUser = (
  sbUser: any,
  profile?: UserProfile | null,
): UnifiedUser | null => {
  if (!sbUser) return null;

  return {
    id: sbUser.id,
    name:
      profile?.full_name ||
      sbUser.user_metadata?.full_name ||
      sbUser.email?.split("@")[0] ||
      "User",
    email: sbUser.email || "",
    avatar: profile?.avatar_url || sbUser.user_metadata?.avatar_url,
    points: profile?.points || 0,
    level: profile?.level || "Beginner",
    wasteClassified: profile?.waste_classified || 0,
    joinedDate: profile?.joined_date || new Date().toISOString().split("T")[0],
    ecoScore: profile?.eco_score || 0,
    badges: [], // Would need to fetch from achievements table
    preferences: {
      darkMode: profile?.preferences?.dark_mode || false,
      notifications: profile?.preferences?.notifications || true,
      language: profile?.preferences?.language || "en",
    },
    source: "supabase",
  };
};



export const UnifiedAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get Supabase auth state
  const {
    user: sbUser,
    loading: sbLoading,
    error: sbError,
    signInWithEmail: sbSignInWithEmail,
    signUpWithEmail: sbSignUpWithEmail,
    signOut: sbSignOut,
  } = useSupabaseAuth();

  // Check if Supabase is properly configured by verifying the actual client
  const isSupabaseConnected = !!supabaseClient;

  useEffect(() => {
    const initializeAuth = async () => {
      if (sbLoading) return; // Wait for Supabase to initialize

      if (sbUser) {
        // User is authenticated via Supabase
        try {
          // In a real implementation, we would fetch the user profile here
          // For now, we'll use the Supabase user data directly
          const unifiedUser = convertSupabaseUser(sbUser);
          if (unifiedUser) {
            setUser(unifiedUser);
          }
        } catch (err) {
          console.error("Error loading Supabase user profile:", err);
          // Fall back to basic user info
          setUser(convertSupabaseUser(sbUser));
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, [sbUser, sbLoading]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConnected) {
        throw new Error("Supabase is not properly configured");
      }

      await sbSignInWithEmail(email, password);
      // User will be set via the useEffect when sbUser updates
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConnected) {
        throw new Error("Supabase is not properly configured");
      }

      await sbSignUpWithEmail(email, password, { full_name: name });
      // User will be set via the useEffect when sbUser updates
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setError(null);

    try {
      // Logout from Supabase if connected
      if (sbUser) {
        await sbSignOut();
      }

      setUser(null);
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message);
    }
  };

  const updateUser = async (updates: Partial<UnifiedUser>): Promise<void> => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      // Supabase user profile updates are handled in the profile service
    } catch (err: any) {
      console.error("Update user error:", err);
      setError(err.message);
    }
  };

  const value: UnifiedAuthContextType = {
    user,
    loading: loading || sbLoading,
    error: error || sbError,
    login,
    signup,
    logout,
    updateUser,
    isSupabaseConnected,
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

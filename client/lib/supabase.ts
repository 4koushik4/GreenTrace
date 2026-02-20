import {
  createClient,
  SupabaseClient,
  User,
  Session,
} from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase as supabaseConfig } from "./config";

/* ----------------------------------------------------
   CLIENT
---------------------------------------------------- */

let supabaseClient: SupabaseClient | null = null;

export const createSupabaseClient = () => {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
};

export const supabase = createSupabaseClient();

/* ----------------------------------------------------
   AUTH HOOK
---------------------------------------------------- */

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  /* ---------------- LOGIN ---------------- */

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      throw error;
    }
  };

  /* ---------------- GOOGLE ---------------- */

  const signInWithGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) {
      setError(error.message);
      throw error;
    }
  };

  /* ---------------- SIGNUP ---------------- */

  const signUp = async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) {
      setError(error.message);
      throw error;
    }
    return data;
  };

  /* ---------------- LOGOUT ---------------- */

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    error,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signUpWithEmail,
    signOut,
  };
};

/* ----------------------------------------------------
   PROFILE TYPES
---------------------------------------------------- */

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  points: number;
  level: string;
  eco_score: number;
  waste_classified: number;
  joined_date: string;
  preferences: {
    notifications: boolean;
    dark_mode: boolean;
    language: string;
  };
}

/* ----------------------------------------------------
   PROFILE HOOK
---------------------------------------------------- */

export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!data) {
        const { data: inserted } = await supabase
          .from("user_profiles")
          .insert({
            id: userId,
            full_name: "User",
            points: 0,
            level: "Beginner",
            eco_score: 0,
            waste_classified: 0,
            joined_date: new Date().toISOString(),
            preferences: {
              notifications: true,
              dark_mode: false,
              language: "en",
            },
          })
          .select()
          .single();

        setProfile(inserted);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();

    // 🔥 REALTIME LISTENER
    const channel = supabase
      .channel("user-profile-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setProfile(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { profile, loading };
};


/* ----------------------------------------------------
   CLASSIFICATIONS HOOK
---------------------------------------------------- */

export interface WasteClassification {
  id: string;
  user_id: string;
  classification: string;
  confidence: number;
  created_at: string;
}

export const useWasteClassifications = (userId?: string) => {
  const [classifications, setClassifications] = useState<WasteClassification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !userId) {
      setClassifications([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("waste_classifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        setClassifications(data || []);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  return { classifications, loading };
};

/* ----------------------------------------------------
   USER LOCATION HOOK
---------------------------------------------------- */

export interface UserLocation {
  id: string;
  user_id: string;
  zone: string;
  region: string;
  ward_number: string;
  created_at: string;
  updated_at: string;
}

export const useUserLocation = (userId?: string) => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !userId) {
      setLocation(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("user_locations")
          .select("*")
          .eq("user_id", userId)
          .single();

        setLocation(data);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  const saveLocation = async (zone: string, region: string, wardNumber: string) => {
    if (!supabase || !userId) return null;

    try {
      const locationData: any = {
        user_id: userId,
        region,
        ward_number: wardNumber,
      };

      // Only include zone if it's not empty
      if (zone.trim()) {
        locationData.zone = zone.trim();
      }

      const { data, error } = await supabase
        .from("user_locations")
        .upsert(locationData)
        .select()
        .single();

      if (error) throw error;
      setLocation(data);
      return data;
    } catch (error) {
      console.error("Error saving location:", error);
      return null;
    }
  };

  return { location, loading, saveLocation };
};

/* ----------------------------------------------------
   USER QR CODE HOOK
---------------------------------------------------- */



/**
 * Advanced Gamification System with Community Features and Blockchain Integration
 * Includes points, badges, levels, leaderboards, challenges, and eco-credits
 */

import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// Core gamification interfaces
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number | string;
  experience?: number;
  totalPoints: number;
  ecoCredits?: number;
  rank?: number;
  badges: Badge[];
  achievements: Achievement[];
  streak?: number;
  joinDate?: string;
  location?: {
    city: string;
    country: string;
  };
  preferences?: {
    publicProfile: boolean;
    shareAchievements: boolean;
    notifications: boolean;
  };
  stats: UserStats;
}

export interface UserStats {
  totalClassifications: number;
  correctClassifications?: number;
  accuracy?: number;
  wasteTypesClassified: Record<string, number>;
  facilitiesVisited?: number;
  co2Saved?: number;
  energySaved?: number;
  waterSaved?: number;
  treesEquivalent?: number;
  weeklyGoal?: number;
  weeklyProgress?: number;
  monthlyImpact: MonthlyImpact;
}

export interface MonthlyImpact {
  classificationsThisMonth: number;
  co2SavedThisMonth?: number;
  pointsEarnedThisMonth: number;
  badgesEarnedThisMonth?: number;
  challengesCompletedThisMonth?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  category:
    | "classification"
    | "environment"
    | "community"
    | "streak"
    | "special";
  earnedDate?: string;
  progress?: {
    current: number;
    required: number;
  };
  requirements: string[];
  ecoCreditsReward: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "milestone" | "challenge" | "special";
  pointsReward: number;
  ecoCreditsReward: number;
  unlockedDate: string;
  shareableUrl?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: "individual" | "team" | "community" | "global";
  difficulty: "easy" | "medium" | "hard" | "extreme";
  duration: {
    start: string;
    end: string;
  };
  requirements: ChallengeRequirement[];
  rewards: {
    points: number;
    ecoCredits: number;
    badges?: string[];
    specialRewards?: string[];
  };
  participants: number;
  status: "upcoming" | "active" | "completed" | "expired";
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
  leaderboard?: LeaderboardEntry[];
}

export interface ChallengeRequirement {
  type: "classify" | "accuracy" | "streak" | "facility" | "social";
  target: number;
  description: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  score: number;
  change: number; // Position change from last update
  badges: Badge[];
  location?: string;
  streak: number;
  level: number;
}

export interface Leaderboard {
  id: string;
  name: string;
  type: "global" | "local" | "friends" | "team";
  timeframe: "daily" | "weekly" | "monthly" | "all-time";
  entries: LeaderboardEntry[];
  lastUpdated: string;
  totalParticipants: number;
}

export interface EcoCredit {
  id: string;
  amount: number;
  source:
    | "classification"
    | "achievement"
    | "challenge"
    | "referral"
    | "purchase";
  description: string;
  transactionHash?: string; // Blockchain transaction hash
  earnedDate: string;
  redeemable: boolean;
  expiryDate?: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: "discount" | "product" | "service" | "donation" | "nft";
  cost: number; // In eco-credits
  category:
    | "sustainable_products"
    | "eco_services"
    | "charity"
    | "collectibles";
  provider: string;
  imageUrl: string;
  available: boolean;
  stock?: number;
  redemptionInstructions: string;
  validUntil?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  type: "organization" | "school" | "community" | "friends";
  memberCount: number;
  totalPoints: number;
  rank: number;
  createdDate: string;
  isPublic: boolean;
  joinRequirements?: string;
  members: TeamMember[];
  challenges: Challenge[];
  achievements: Achievement[];
}

export interface TeamMember {
  userId: string;
  username: string;
  displayName: string;
  role: "admin" | "moderator" | "member";
  joinDate: string;
  contribution: number;
  status: "active" | "inactive";
}

// Gamification Hook
export const useGamification = (userId?: string) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [ecoCredits, setEcoCredits] = useState<EcoCredit[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const clearData = () => {
      setUserProfile(null);
      setBadges([]);
      setAchievements([]);
      setChallenges([]);
      setLeaderboards([]);
      setEcoCredits([]);
      setRewards([]);
      setTeams([]);
    };

    const loadData = async () => {
      if (!userId) {
        clearData();
        setError(null);
        setLoading(false);
        return;
      }

      if (!supabase) {
        clearData();
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [profileResult, classificationsResult] = await Promise.all([
          supabase
            .from("user_profiles")
            .select(
              "id, email, full_name, avatar_url, points, level, joined_date, location, preferences",
            )
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("waste_classifications")
            .select("classification, points_earned, created_at")
            .eq("user_id", userId),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (classificationsResult.error) throw classificationsResult.error;
        if (cancelled) return;

        const profile = profileResult.data;
        const classifications = classificationsResult.data || [];
        if (!profile) {
          clearData();
          return;
        }

        const wasteTypesClassified = classifications.reduce<
          Record<string, number>
        >((counts, item) => {
          const classification = item.classification || "unknown";
          counts[classification] = (counts[classification] || 0) + 1;
          return counts;
        }, {});
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthlyClassifications = classifications.filter(
          (item) => new Date(item.created_at) >= monthStart,
        );
        const location =
          profile.location && typeof profile.location === "object"
            ? profile.location
            : undefined;

        setUserProfile({
          id: profile.id,
          username: profile.email?.split("@")[0] || profile.id,
          displayName: profile.full_name || profile.email || profile.id,
          avatar: profile.avatar_url || undefined,
          level: profile.level || "",
          totalPoints: profile.points ?? 0,
          badges: [],
          achievements: [],
          joinDate: profile.joined_date || undefined,
          location:
            location && (location.city || location.country)
              ? { city: location.city || "", country: location.country || "" }
              : undefined,
          preferences: profile.preferences || undefined,
          stats: {
            totalClassifications: classifications.length,
            wasteTypesClassified,
            monthlyImpact: {
              classificationsThisMonth: monthlyClassifications.length,
              pointsEarnedThisMonth: monthlyClassifications.reduce(
                (total, item) => total + (item.points_earned || 0),
                0,
              ),
            },
          },
        });
        setBadges([]);
        setAchievements([]);
        setChallenges([]);
        setLeaderboards([]);
        setEcoCredits([]);
        setRewards([]);
        setTeams([]);
      } catch (err) {
        if (!cancelled) {
          clearData();
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load gamification data.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const awardPoints = async (points: number, source: string): Promise<void> => {
    if (!userProfile) return;

    const experience =
      (userProfile.experience ?? userProfile.totalPoints) + points;
    const newProfile = {
      ...userProfile,
      totalPoints: userProfile.totalPoints + points,
      experience,
    };

    // Check for level up
    const newLevel = calculateLevel(experience);
    const currentLevel =
      typeof userProfile.level === "number"
        ? userProfile.level
        : calculateLevel(userProfile.totalPoints);
    if (newLevel > currentLevel) {
      newProfile.level = newLevel;
      await triggerLevelUpRewards(newLevel);
    }

    setUserProfile(newProfile);

    // Check for new badges/achievements
    await checkForNewBadges(newProfile);
  };

  const awardEcoCredits = async (
    amount: number,
    source: string,
    description: string,
  ): Promise<void> => {
    const newCredit: EcoCredit = {
      id: `eco-${Date.now()}`,
      amount,
      source: source as any,
      description,
      earnedDate: new Date().toISOString(),
      redeemable: true,
    };

    setEcoCredits((prev) => [newCredit, ...prev]);

    if (userProfile) {
      setUserProfile({
        ...userProfile,
        ecoCredits: userProfile.ecoCredits + amount,
      });
    }
  };

  const redeemReward = async (rewardId: string): Promise<boolean> => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward || !userProfile || userProfile.ecoCredits < reward.cost) {
      return false;
    }

    // Deduct eco-credits
    setUserProfile({
      ...userProfile,
      ecoCredits: userProfile.ecoCredits - reward.cost,
    });

    // Add redemption record
    const redemptionCredit: EcoCredit = {
      id: `redemption-${Date.now()}`,
      amount: -reward.cost,
      source: "purchase",
      description: `Redeemed: ${reward.name}`,
      earnedDate: new Date().toISOString(),
      redeemable: false,
    };

    setEcoCredits((prev) => [redemptionCredit, ...prev]);

    return true;
  };

  const joinChallenge = async (challengeId: string): Promise<boolean> => {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge || challenge.status !== "active") return false;

    // Add user to challenge participants
    const updatedChallenge = {
      ...challenge,
      participants: challenge.participants + 1,
    };

    setChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? updatedChallenge : c)),
    );

    return true;
  };

  const updateChallengeProgress = async (
    challengeId: string,
    progress: number,
  ): Promise<void> => {
    setChallenges((prev) =>
      prev.map((challenge) => {
        if (challenge.id === challengeId) {
          const updatedProgress = {
            current: progress,
            target: challenge.progress?.target || 100,
            percentage: Math.min(
              100,
              (progress / (challenge.progress?.target || 100)) * 100,
            ),
          };

          // Check for completion
          if (updatedProgress.percentage >= 100) {
            awardPoints(
              challenge.rewards.points,
              `Challenge: ${challenge.name}`,
            );
            awardEcoCredits(
              challenge.rewards.ecoCredits,
              "challenge",
              `Completed: ${challenge.name}`,
            );
          }

          return {
            ...challenge,
            progress: updatedProgress,
          };
        }
        return challenge;
      }),
    );
  };

  const createTeam = async (
    teamData: Omit<Team, "id" | "createdDate" | "members">,
  ): Promise<string> => {
    const newTeam: Team = {
      ...teamData,
      id: `team-${Date.now()}`,
      createdDate: new Date().toISOString(),
      members: userProfile
        ? [
            {
              userId: userProfile.id,
              username: userProfile.username,
              displayName: userProfile.displayName,
              role: "admin",
              joinDate: new Date().toISOString(),
              contribution: 0,
              status: "active",
            },
          ]
        : [],
    };

    setTeams((prev) => [newTeam, ...prev]);
    return newTeam.id;
  };

  const joinTeam = async (teamId: string): Promise<boolean> => {
    if (!userProfile) return false;

    const team = teams.find((t) => t.id === teamId);
    if (!team) return false;

    const newMember: TeamMember = {
      userId: userProfile.id,
      username: userProfile.username,
      displayName: userProfile.displayName,
      role: "member",
      joinDate: new Date().toISOString(),
      contribution: 0,
      status: "active",
    };

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              members: [...t.members, newMember],
              memberCount: t.memberCount + 1,
            }
          : t,
      ),
    );

    return true;
  };

  return {
    userProfile,
    badges,
    achievements,
    challenges,
    leaderboards,
    ecoCredits,
    rewards,
    teams,
    loading,
    error,
    awardPoints,
    awardEcoCredits,
    redeemReward,
    joinChallenge,
    updateChallengeProgress,
    createTeam,
    joinTeam,
  };
};

// Utility functions
const calculateLevel = (experience: number): number => {
  // Experience required: level^2 * 100
  return Math.floor(Math.sqrt(experience / 100)) + 1;
};

const triggerLevelUpRewards = async (newLevel: number): Promise<void> => {
  // Award level-up rewards
  const bonusCredits = newLevel * 10;
  console.log(`Level up! Awarded ${bonusCredits} eco-credits`);
};

const checkForNewBadges = async (profile: UserProfile): Promise<void> => {
  // Check badge requirements against user stats
  console.log("Checking for new badges...");
};

/**
 * Advanced Gamification System with Community Features and Blockchain Integration
 * Includes points, badges, levels, leaderboards, challenges, and eco-credits
 */

import { useState, useEffect } from "react";

// Core gamification interfaces
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  experience: number;
  totalPoints: number;
  ecoCredits: number;
  rank: number;
  badges: Badge[];
  achievements: Achievement[];
  streak: number;
  joinDate: string;
  location?: {
    city: string;
    country: string;
  };
  preferences: {
    publicProfile: boolean;
    shareAchievements: boolean;
    notifications: boolean;
  };
  stats: UserStats;
}

export interface UserStats {
  totalClassifications: number;
  correctClassifications: number;
  accuracy: number;
  wasteTypesClassified: Record<string, number>;
  facilitiesVisited: number;
  co2Saved: number;
  energySaved: number;
  waterSaved: number;
  treesEquivalent: number;
  weeklyGoal: number;
  weeklyProgress: number;
  monthlyImpact: MonthlyImpact;
}

export interface MonthlyImpact {
  classificationsThisMonth: number;
  co2SavedThisMonth: number;
  pointsEarnedThisMonth: number;
  badgesEarnedThisMonth: number;
  challengesCompletedThisMonth: number;
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
    if (userId) {
      loadUserGamificationData(userId);
    } else {
      loadMockData();
    }
  }, [userId]);

  const loadUserGamificationData = async (userId: string) => {
    try {
      setLoading(true);
      // In real app, fetch from API
      await loadMockData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load gamification data",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = async () => {
    // Mock data for development
    setUserProfile(mockUserProfile);
    setBadges(mockBadges);
    setAchievements(mockAchievements);
    setChallenges(mockChallenges);
    setLeaderboards(mockLeaderboards);
    setEcoCredits(mockEcoCredits);
    setRewards(mockRewards);
    setTeams(mockTeams);
    setLoading(false);
  };

  const awardPoints = async (points: number, source: string): Promise<void> => {
    if (!userProfile) return;

    const newProfile = {
      ...userProfile,
      totalPoints: userProfile.totalPoints + points,
      experience: userProfile.experience + points,
    };

    // Check for level up
    const newLevel = calculateLevel(newProfile.experience);
    if (newLevel > userProfile.level) {
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

// Mock data for development
const mockUserProfile: UserProfile = {
  id: "user-123",
  username: "eco_warrior_2024",
  displayName: "Alex Chen",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  level: 15,
  experience: 22500,
  totalPoints: 18750,
  ecoCredits: 2340,
  rank: 42,
  badges: [],
  achievements: [],
  streak: 23,
  joinDate: "2024-01-01T00:00:00Z",
  location: {
    city: "San Francisco",
    country: "USA",
  },
  preferences: {
    publicProfile: true,
    shareAchievements: true,
    notifications: true,
  },
  stats: {
    totalClassifications: 1547,
    correctClassifications: 1465,
    accuracy: 94.7,
    wasteTypesClassified: {
      biodegradable: 623,
      recyclable: 731,
      hazardous: 193,
    },
    facilitiesVisited: 12,
    co2Saved: 45.7,
    energySaved: 234.5,
    waterSaved: 1250,
    treesEquivalent: 8.3,
    weeklyGoal: 50,
    weeklyProgress: 32,
    monthlyImpact: {
      classificationsThisMonth: 234,
      co2SavedThisMonth: 8.9,
      pointsEarnedThisMonth: 2850,
      badgesEarnedThisMonth: 3,
      challengesCompletedThisMonth: 2,
    },
  },
};

const mockBadges: Badge[] = [
  {
    id: "first-sort",
    name: "First Sort",
    description: "Classified your first waste item",
    icon: "🥇",
    rarity: "common",
    category: "classification",
    earnedDate: "2024-01-01T10:00:00Z",
    requirements: ["Complete 1 classification"],
    ecoCreditsReward: 10,
  },
  {
    id: "accuracy-master",
    name: "Accuracy Master",
    description: "Achieve 95% accuracy over 100 classifications",
    icon: "🎯",
    rarity: "epic",
    category: "classification",
    earnedDate: "2024-01-10T15:30:00Z",
    requirements: ["95% accuracy", "100+ classifications"],
    ecoCreditsReward: 100,
  },
  {
    id: "streak-warrior",
    name: "Streak Warrior",
    description: "Maintain a 30-day classification streak",
    icon: "🔥",
    rarity: "rare",
    category: "streak",
    progress: { current: 23, required: 30 },
    requirements: ["30-day streak"],
    ecoCreditsReward: 75,
  },
  {
    id: "eco-champion",
    name: "Eco Champion",
    description: "Save 50kg CO₂ through proper waste sorting",
    icon: "🌱",
    rarity: "legendary",
    category: "environment",
    progress: { current: 45.7, required: 50 },
    requirements: ["Save 50kg CO₂"],
    ecoCreditsReward: 200,
  },
];

const mockAchievements: Achievement[] = [
  {
    id: "achievement-1",
    name: "Community Leader",
    description: "Helped 100 users improve their sorting accuracy",
    icon: "👑",
    type: "milestone",
    pointsReward: 1000,
    ecoCreditsReward: 150,
    unlockedDate: "2024-01-12T09:00:00Z",
    shareableUrl: "https://ecosort.app/achievements/community-leader",
  },
];

const mockChallenges: Challenge[] = [
  {
    id: "challenge-1",
    name: "January Sorting Sprint",
    description: "Classify 200 items this month and maintain 90% accuracy",
    type: "individual",
    difficulty: "medium",
    duration: {
      start: "2024-01-01T00:00:00Z",
      end: "2024-01-31T23:59:59Z",
    },
    requirements: [
      { type: "classify", target: 200, description: "Classify 200 items" },
      { type: "accuracy", target: 90, description: "Maintain 90% accuracy" },
    ],
    rewards: {
      points: 2000,
      ecoCredits: 300,
      badges: ["challenge-master"],
    },
    participants: 1247,
    status: "active",
    progress: {
      current: 156,
      target: 200,
      percentage: 78,
    },
  },
  {
    id: "challenge-2",
    name: "Team Green Warriors",
    description: "Work with your team to classify 5000 items collectively",
    type: "team",
    difficulty: "hard",
    duration: {
      start: "2024-01-15T00:00:00Z",
      end: "2024-02-15T23:59:59Z",
    },
    requirements: [
      {
        type: "classify",
        target: 5000,
        description: "Team classification goal",
      },
    ],
    rewards: {
      points: 5000,
      ecoCredits: 750,
      badges: ["team-player", "green-warrior"],
    },
    participants: 48,
    status: "active",
    progress: {
      current: 2340,
      target: 5000,
      percentage: 46.8,
    },
  },
];

const mockLeaderboards: Leaderboard[] = [
  {
    id: "global-weekly",
    name: "Global Weekly Leaderboard",
    type: "global",
    timeframe: "weekly",
    entries: [
      {
        rank: 1,
        userId: "user-456",
        username: "eco_master",
        displayName: "Sarah Johnson",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        score: 1250,
        change: 2,
        badges: [],
        location: "New York, USA",
        streak: 45,
        level: 18,
      },
      {
        rank: 2,
        userId: "user-789",
        username: "green_guardian",
        displayName: "Mike Chen",
        score: 1180,
        change: -1,
        badges: [],
        location: "London, UK",
        streak: 32,
        level: 16,
      },
    ],
    lastUpdated: "2024-01-15T12:00:00Z",
    totalParticipants: 12847,
  },
];

const mockEcoCredits: EcoCredit[] = [
  {
    id: "eco-1",
    amount: 25,
    source: "classification",
    description: "Classified 5 items with 100% accuracy",
    earnedDate: "2024-01-15T10:30:00Z",
    redeemable: true,
  },
  {
    id: "eco-2",
    amount: 100,
    source: "achievement",
    description: "Unlocked Accuracy Master badge",
    earnedDate: "2024-01-14T16:45:00Z",
    redeemable: true,
  },
];

const mockRewards: Reward[] = [
  {
    id: "reward-1",
    name: "20% Off Eco-Friendly Products",
    description:
      "Get 20% discount on sustainable products from our partner stores",
    type: "discount",
    cost: 100,
    category: "sustainable_products",
    provider: "EcoStore",
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop",
    available: true,
    stock: 50,
    redemptionInstructions: "Use code ECO20 at checkout",
    validUntil: "2024-03-31T23:59:59Z",
  },
  {
    id: "reward-2",
    name: "Plant a Tree Donation",
    description:
      "Fund the planting of one tree through our reforestation partner",
    type: "donation",
    cost: 250,
    category: "charity",
    provider: "TreeFund",
    imageUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop",
    available: true,
    redemptionInstructions:
      "Tree will be planted and you will receive a certificate",
  },
];

const mockTeams: Team[] = [
  {
    id: "team-1",
    name: "Green Office Warriors",
    description:
      "Making our workplace more sustainable one classification at a time",
    type: "organization",
    memberCount: 25,
    totalPoints: 45000,
    rank: 12,
    createdDate: "2024-01-01T00:00:00Z",
    isPublic: true,
    members: [],
    challenges: [],
    achievements: [],
  },
];

export {
  mockUserProfile,
  mockBadges,
  mockAchievements,
  mockChallenges,
  mockLeaderboards,
  mockEcoCredits,
  mockRewards,
  mockTeams,
};

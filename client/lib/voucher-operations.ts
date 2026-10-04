/**
 * Real Supabase Voucher Operations
 * Handles voucher redemption, transaction tracking, and point management
 */

import { supabase } from "./supabase";
import {
  Voucher,
  VoucherRedemption,
  UserTransaction,
  generateVoucherCode,
} from "./vouchers";

const mapReward = (reward: any): Voucher => ({
  id: reward.id,
  category: reward.category || "uncategorized",
  brand: reward.provider,
  title: reward.name,
  description: reward.description,
  pointsRequired: reward.cost_in_points,
  originalValue: null,
  discountType: reward.type,
  discountValue: null,
  image: reward.image_url,
  logo: null,
  color: null,
  validityDays: null,
  validUntil: reward.valid_until,
  termsAndConditions: [],
  isActive: reward.available,
  stockLimit: reward.stock,
  currentStock: reward.stock,
});

const mapRedemption = (redemption: any): VoucherRedemption => {
  const reward = Array.isArray(redemption.reward)
    ? redemption.reward[0]
    : redemption.reward;
  const hasExpired =
    reward?.valid_until && new Date(reward.valid_until).getTime() < Date.now();
  return {
    id: redemption.id,
    userId: redemption.user_id,
    voucherId: redemption.reward_id,
    voucherCode: redemption.redemption_code || "",
    pointsUsed: redemption.points_used ?? 0,
    status: hasExpired
      ? "expired"
      : redemption.status === "completed"
        ? "used"
        : redemption.status === "cancelled"
          ? "expired"
          : "active",
    redeemedAt: redemption.redeemed_at,
    expiresAt: reward?.valid_until || null,
    voucher: reward ? mapReward(reward) : undefined,
  };
};

// Error types for better error handling
export class InsufficientPointsError extends Error {
  constructor(required: number, available: number) {
    super(
      `Insufficient points. Required: ${required}, Available: ${available}`,
    );
    this.name = "InsufficientPointsError";
  }
}

export class VoucherNotFoundError extends Error {
  constructor(voucherId: string) {
    super(`Voucher not found: ${voucherId}`);
    this.name = "VoucherNotFoundError";
  }
}

export class VoucherOutOfStockError extends Error {
  constructor(voucherId: string) {
    super(`Voucher out of stock: ${voucherId}`);
    this.name = "VoucherOutOfStockError";
  }
}

/**
 * Fetch the reward catalog from Supabase
 */
export const fetchVouchers = async (): Promise<Voucher[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("available", true)
    .order("cost_in_points", { ascending: true, nullsFirst: false });

  if (error) throw error;

  return (
    data?.map(mapReward) || []
  );
};

/**
 * Get user's current points
 */
export const getUserPoints = async (userId: string): Promise<number> => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("points")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data?.points || 0;
};

/**
 * Redeem a voucher with full transaction support
 */
export const redeemVoucherReal = async (
  voucherId: string,
  userId: string,
): Promise<VoucherRedemption> => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data: reward, error: rewardError } = await supabase
    .from("rewards")
    .select("*")
    .eq("id", voucherId)
    .single();

  if (rewardError || !reward) {
    throw new VoucherNotFoundError(voucherId);
  }

  if (!reward.available) {
    throw new VoucherNotFoundError(voucherId);
  }
  if (reward.stock !== null && reward.stock <= 0) {
    throw new VoucherOutOfStockError(voucherId);
  }
  if (reward.cost_in_points == null || reward.cost_in_points <= 0) {
    throw new Error("This reward does not have a valid points cost.");
  }

  const userPoints = await getUserPoints(userId);
  if (userPoints < reward.cost_in_points) {
    throw new InsufficientPointsError(reward.cost_in_points, userPoints);
  }

  const voucherCode = generateVoucherCode(voucherId);
  const { data, error } = await supabase.rpc("redeem_reward", {
    reward_id_input: voucherId,
    redemption_code_input: voucherCode,
  });
  if (error) throw error;

  const redemption = Array.isArray(data) ? data[0] : data;
  if (!redemption) throw new Error("Redemption did not return a record.");
  return mapRedemption({ ...redemption, reward });
};

/**
 * Record a user transaction
 */
export const recordTransaction = async (
  userId: string,
  transaction: {
    type: "earned" | "redeemed" | "bonus";
    points: number;
    description: string;
    metadata?: Record<string, any>;
  },
): Promise<UserTransaction> => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data, error } = await supabase
    .from("user_activities")
    .insert({
      user_id: userId,
      activity_type: transaction.type,
      points_earned: transaction.points,
      description: transaction.description,
      metadata: transaction.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    type:
      data.activity_type === "redeemed" || data.points_earned < 0
        ? "redeemed"
        : data.activity_type === "bonus"
          ? "bonus"
          : "earned",
    points: data.points_earned,
    description: data.description,
    metadata: data.metadata,
    createdAt: data.created_at,
  };
};

/**
 * Award points to user and record transaction
 */
export const awardPoints = async (
  userId: string,
  points: number,
  description: string,
  metadata?: Record<string, any>,
): Promise<void> => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    // Add points to user profile
    const { error: pointsError } = await supabase.rpc("update_user_points", {
      user_uuid: userId,
      points_to_add: points,
    });

    if (pointsError) throw pointsError;

    // Record transaction
    await recordTransaction(userId, {
      type: "earned",
      points,
      description,
      metadata,
    });
  } catch (error) {
    const msg = (error as any)?.message || JSON.stringify(error);
    console.warn("Award points failed:", msg);
    throw error;
  }
};

/**
 * Get user's voucher redemption history
 */
export const getUserRedemptionsReal = async (
  userId: string,
): Promise<VoucherRedemption[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data, error } = await supabase
    .from("reward_redemptions")
    .select("*, reward:rewards(*)")
    .eq("user_id", userId)
    .order("redeemed_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(mapRedemption);
};

/**
 * Get user's transaction history
 */
export const getUserTransactionsReal = async (
  userId: string,
): Promise<UserTransaction[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const [{ data: activities, error: activityError }, { data: redemptions, error: redemptionError }] =
    await Promise.all([
      supabase
        .from("user_activities")
        .select("id, user_id, activity_type, points_earned, description, metadata, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("reward_redemptions")
        .select("id, user_id, reward_id, points_used, redemption_code, redeemed_at, reward:rewards(name, provider, category)")
        .eq("user_id", userId)
        .order("redeemed_at", { ascending: false })
        .limit(100),
    ]);

  if (activityError) throw activityError;
  if (redemptionError) throw redemptionError;

  const activityTransactions = (activities || []).map((item) => ({
    id: item.id,
    userId: item.user_id,
    type:
      item.activity_type === "redeemed" || item.points_earned < 0
        ? ("redeemed" as const)
        : item.activity_type === "bonus"
          ? ("bonus" as const)
          : ("earned" as const),
    points: item.points_earned || 0,
    description: item.description || item.activity_type || "Activity",
    metadata: item.metadata,
    createdAt: item.created_at,
  }));
  const redemptionTransactions = (redemptions || []).map((item) => {
    const reward = Array.isArray(item.reward) ? item.reward[0] : item.reward;
    return {
      id: item.id,
      userId: item.user_id,
      type: "redeemed" as const,
      points: -(item.points_used || 0),
      description: `Redeemed: ${reward?.name || "Reward"}`,
      metadata: {
        voucher_code: item.redemption_code,
        brand: reward?.provider,
        category: reward?.category,
      },
      createdAt: item.redeemed_at,
    };
  });

  return [...activityTransactions, ...redemptionTransactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100);
};

/**
 * Mark a voucher as used
 */
export const markVoucherAsUsed = async (
  redemptionId: string,
): Promise<void> => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { error } = await supabase
    .from("reward_redemptions")
    .update({
      status: "completed",
    })
    .eq("id", redemptionId);

  if (error) throw error;
};

/**
 * Get vouchers available to a user based on their points
 */
export const getAvailableVouchersForUser = async (
  userId: string,
): Promise<Voucher[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const userPoints = await getUserPoints(userId);
  const vouchers = await fetchVouchers();

  return vouchers.filter(
    (voucher) =>
      voucher.pointsRequired !== null &&
      voucher.pointsRequired <= userPoints &&
      voucher.isActive &&
      (voucher.currentStock == null || voucher.currentStock > 0),
  );
};

/**
 * Check if a voucher redemption code is valid
 */
export const validateVoucherCode = async (
  voucherCode: string,
): Promise<VoucherRedemption | null> => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data, error } = await supabase
    .from("reward_redemptions")
    .select("*, reward:rewards(*)")
    .eq("redemption_code", voucherCode)
    .eq("status", "pending")
    .maybeSingle();

  if (error || !data) return null;
  if (data.reward?.valid_until && new Date() > new Date(data.reward.valid_until)) {
    await supabase
      .from("reward_redemptions")
      .update({ status: "cancelled" })
      .eq("id", data.id);
    return null;
  }
  return mapRedemption(data);
};

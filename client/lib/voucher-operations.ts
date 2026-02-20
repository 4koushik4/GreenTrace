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
  canRedeemVoucher,
} from "./vouchers";

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
 * Fetch all available vouchers from Supabase
 */
export const fetchVouchers = async (): Promise<Voucher[]> => {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("is_active", true)
    .order("points_required", { ascending: true });

  if (error) throw error;

  return (
    data?.map((item) => ({
      id: item.id,
      category: item.category,
      brand: item.brand,
      title: item.title,
      description: item.description,
      pointsRequired: item.points_required,
      originalValue: item.original_value,
      discountType: item.discount_type,
      discountValue: item.discount_value,
      image: item.image,
      logo: item.logo,
      color: item.color,
      validityDays: item.validity_days,
      termsAndConditions: item.terms_and_conditions || [],
      isActive: item.is_active,
      stockLimit: item.stock_limit,
      currentStock: item.current_stock,
    })) || []
  );
};

/**
 * Get user's current points
 */
export const getUserPoints = async (userId: string): Promise<number> => {
  if (!supabase) {
    // Local fallback: read points from localStorage
    try {
      const key = `ecosort_local_points_${userId}`;
      const raw = localStorage.getItem(key);
      return raw ? Number(raw) : 0;
    } catch (e) {
      console.warn("Local getUserPoints failed", e);
      return 0;
    }
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

  // Start a Supabase transaction
  const { data: voucher, error: voucherError } = await supabase
    .from("vouchers")
    .select("*")
    .eq("id", voucherId)
    .single();

  if (voucherError || !voucher) {
    throw new VoucherNotFoundError(voucherId);
  }

  // Check stock
  if (voucher.current_stock !== null && voucher.current_stock <= 0) {
    throw new VoucherOutOfStockError(voucherId);
  }

  // Get user points
  const userPoints = await getUserPoints(userId);

  // Check if user can redeem
  if (userPoints < voucher.points_required) {
    throw new InsufficientPointsError(voucher.points_required, userPoints);
  }

  // Generate unique voucher code
  const voucherCode = generateVoucherCode(voucherId);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + voucher.validity_days);

  try {
    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from("voucher_redemptions")
      .insert({
        user_id: userId,
        voucher_id: voucherId,
        voucher_code: voucherCode,
        points_used: voucher.points_required,
        status: "active",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (redemptionError) throw redemptionError;

    // Deduct points from user
    const { error: pointsError } = await supabase
      .from("user_profiles")
      .update({
        points: userPoints - voucher.points_required,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (pointsError) throw pointsError;

    // Update voucher stock
    if (voucher.current_stock !== null) {
      const { error: stockError } = await supabase
        .from("vouchers")
        .update({
          current_stock: voucher.current_stock - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", voucherId);

      if (stockError) throw stockError;
    }

    // Record transaction
    await recordTransaction(userId, {
      type: "redeemed",
      points: -voucher.points_required,
      description: `Redeemed: ${voucher.title}`,
      metadata: {
        voucher_id: voucherId,
        voucher_code: voucherCode,
        redemption_id: redemption.id,
      },
    });

    // Return formatted redemption
    return {
      id: redemption.id,
      userId: redemption.user_id,
      voucherId: redemption.voucher_id,
      voucherCode: redemption.voucher_code,
      pointsUsed: redemption.points_used,
      status: redemption.status,
      redeemedAt: redemption.redeemed_at,
      expiresAt: redemption.expires_at,
      voucher: {
        id: voucher.id,
        category: voucher.category,
        brand: voucher.brand,
        title: voucher.title,
        description: voucher.description,
        pointsRequired: voucher.points_required,
        originalValue: voucher.original_value,
        discountType: voucher.discount_type,
        discountValue: voucher.discount_value,
        image: voucher.image,
        logo: voucher.logo,
        color: voucher.color,
        validityDays: voucher.validity_days,
        termsAndConditions: voucher.terms_and_conditions || [],
        isActive: voucher.is_active,
        stockLimit: voucher.stock_limit,
        currentStock: voucher.current_stock,
      },
    };
  } catch (error) {
    console.error("Voucher redemption failed:", error);
    throw error;
  }
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
    // Local fallback: persist to localStorage
    try {
      const key = `ecosort_local_transactions_${userId}`;
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const item = {
        id: `local-${Date.now()}`,
        user_id: userId,
        type: transaction.type,
        points: transaction.points,
        description: transaction.description,
        metadata: transaction.metadata || {},
        created_at: new Date().toISOString(),
      };
      list.unshift(item);
      localStorage.setItem(key, JSON.stringify(list));
      return {
        id: item.id,
        userId: item.user_id,
        type: item.type,
        points: item.points,
        description: item.description,
        metadata: item.metadata,
        createdAt: item.created_at,
      };
    } catch (e) {
      console.warn("Local recordTransaction failed", e);
      throw e;
    }
  }

  const { data, error } = await supabase
    .from("user_transactions")
    .insert({
      user_id: userId,
      type: transaction.type,
      points: transaction.points,
      description: transaction.description,
      metadata: transaction.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    type: data.type,
    points: data.points,
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
    // Local fallback: increment local points and record transaction
    try {
      const key = `ecosort_local_points_${userId}`;
      const current = Number(localStorage.getItem(key) || "0");
      localStorage.setItem(key, String(current + points));

      await recordTransaction(userId, {
        type: "earned",
        points,
        description,
        metadata,
      });
      return;
    } catch (e) {
      console.warn("Local awardPoints failed:", e);
      return;
    }
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
    .from("voucher_redemptions")
    .select(
      `
      *,
      voucher:vouchers(*)
    `,
    )
    .eq("user_id", userId)
    .order("redeemed_at", { ascending: false });

  if (error) throw error;

  return (
    data?.map((item) => ({
      id: item.id,
      userId: item.user_id,
      voucherId: item.voucher_id,
      voucherCode: item.voucher_code,
      pointsUsed: item.points_used,
      status: item.status,
      redeemedAt: item.redeemed_at,
      expiresAt: item.expires_at,
      usedAt: item.used_at,
      voucher: item.voucher
        ? {
            id: item.voucher.id,
            category: item.voucher.category,
            brand: item.voucher.brand,
            title: item.voucher.title,
            description: item.voucher.description,
            pointsRequired: item.voucher.points_required,
            originalValue: item.voucher.original_value,
            discountType: item.voucher.discount_type,
            discountValue: item.voucher.discount_value,
            image: item.voucher.image,
            logo: item.voucher.logo,
            color: item.voucher.color,
            validityDays: item.voucher.validity_days,
            termsAndConditions: item.voucher.terms_and_conditions || [],
            isActive: item.voucher.is_active,
            stockLimit: item.voucher.stock_limit,
            currentStock: item.voucher.current_stock,
          }
        : undefined,
    })) || []
  );
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

  const { data, error } = await supabase
    .from("user_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return (
    data?.map((item) => ({
      id: item.id,
      userId: item.user_id,
      type: item.type,
      points: item.points,
      description: item.description,
      metadata: item.metadata,
      createdAt: item.created_at,
    })) || []
  );
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
    .from("voucher_redemptions")
    .update({
      status: "used",
      used_at: new Date().toISOString(),
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
      voucher.pointsRequired <= userPoints &&
      voucher.isActive &&
      (voucher.currentStock === undefined || voucher.currentStock > 0),
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
    .from("voucher_redemptions")
    .select(
      `
      *,
      voucher:vouchers(*)
    `,
    )
    .eq("voucher_code", voucherCode)
    .eq("status", "active")
    .single();

  if (error || !data) return null;

  // Check if voucher is expired
  const now = new Date();
  const expiresAt = new Date(data.expires_at);

  if (now > expiresAt) {
    // Mark as expired
    await supabase
      .from("voucher_redemptions")
      .update({ status: "expired" })
      .eq("id", data.id);

    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    voucherId: data.voucher_id,
    voucherCode: data.voucher_code,
    pointsUsed: data.points_used,
    status: data.status,
    redeemedAt: data.redeemed_at,
    expiresAt: data.expires_at,
    usedAt: data.used_at,
    voucher: data.voucher
      ? {
          id: data.voucher.id,
          category: data.voucher.category,
          brand: data.voucher.brand,
          title: data.voucher.title,
          description: data.voucher.description,
          pointsRequired: data.voucher.points_required,
          originalValue: data.voucher.original_value,
          discountType: data.voucher.discount_type,
          discountValue: data.voucher.discount_value,
          image: data.voucher.image,
          logo: data.voucher.logo,
          color: data.voucher.color,
          validityDays: data.voucher.validity_days,
          termsAndConditions: data.voucher.terms_and_conditions || [],
          isActive: data.voucher.is_active,
          stockLimit: data.voucher.stock_limit,
          currentStock: data.voucher.current_stock,
        }
      : undefined,
  };
};

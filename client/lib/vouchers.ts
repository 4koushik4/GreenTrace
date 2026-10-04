/**
 * Types and presentation helpers for rewards stored in Supabase.
 */

export interface Voucher {
  id: string;
  category: string;
  brand: string | null;
  title: string;
  description: string | null;
  pointsRequired: number | null;
  originalValue: number | null;
  discountType: "percentage" | "fixed" | "free" | "discount" | "product" | "service" | "donation" | null;
  discountValue: number | null;
  image: string | null;
  logo: string | null;
  color: string | null;
  validityDays: number | null;
  validUntil?: string | null;
  termsAndConditions: string[];
  isActive: boolean;
  stockLimit?: number | null;
  currentStock?: number | null;
}

export type VoucherCategory = string;

export interface VoucherRedemption {
  id: string;
  userId: string;
  voucherId: string;
  voucherCode: string;
  pointsUsed: number;
  status: "active" | "used" | "expired";
  redeemedAt: string;
  expiresAt: string | null;
  usedAt?: string;
  voucher?: Voucher;
}

export interface UserTransaction {
  id: string;
  userId: string;
  type: "earned" | "redeemed" | "bonus";
  points: number;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export const voucherCategories: Record<
  string,
  { title: string; icon: string; color: string; bgColor: string }
> = {
  shopping: {
    title: "Shopping Discounts",
    icon: "🛒",
    color: "#3B82F6",
    bgColor: "from-blue-500/10 to-blue-600/20",
  },
  food: {
    title: "Food & Beverages",
    icon: "🍕",
    color: "#F59E0B",
    bgColor: "from-amber-500/10 to-orange-600/20",
  },
  travel: {
    title: "Travel & Transport",
    icon: "🚕",
    color: "#8B5CF6",
    bgColor: "from-purple-500/10 to-purple-600/20",
  },
  "eco-friendly": {
    title: "Eco-friendly Stores",
    icon: "🌱",
    color: "#10B981",
    bgColor: "from-green-500/10 to-emerald-600/20",
  },
  entertainment: {
    title: "Entertainment",
    icon: "🎬",
    color: "#EF4444",
    bgColor: "from-red-500/10 to-red-600/20",
  },
  services: {
    title: "Services",
    icon: "🛠️",
    color: "#6366F1",
    bgColor: "from-indigo-500/10 to-indigo-600/20",
  },
};

export const generateVoucherCode = (rewardId: string): string => {
  const prefix = rewardId.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const calculateVoucherValue = (voucher: Voucher): string => {
  switch (voucher.discountType) {
    case "percentage":
      return voucher.discountValue == null
        ? "Discount"
        : `${voucher.discountValue}% OFF`;
    case "fixed":
      return voucher.discountValue == null
        ? "Discount"
        : `₹${voucher.discountValue} OFF`;
    case "free":
      return "FREE";
    case "discount":
      return "Discount";
    case "product":
      return "Product";
    case "service":
      return "Service";
    case "donation":
      return "Donation";
    default:
      return voucher.originalValue == null
        ? "Reward"
        : `₹${voucher.originalValue} VALUE`;
  }
};

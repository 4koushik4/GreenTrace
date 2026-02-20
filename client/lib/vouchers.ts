/**
 * Voucher System Configuration
 * Defines available vouchers, categories, and redemption logic
 */

export interface Voucher {
  id: string;
  category: VoucherCategory;
  brand: string;
  title: string;
  description: string;
  pointsRequired: number;
  originalValue: number;
  discountType: 'percentage' | 'fixed' | 'free';
  discountValue: number;
  image: string;
  logo: string;
  color: string;
  validityDays: number;
  termsAndConditions: string[];
  isActive: boolean;
  stockLimit?: number;
  currentStock?: number;
}

export type VoucherCategory = 
  | 'shopping'
  | 'food'
  | 'travel'
  | 'eco-friendly'
  | 'entertainment'
  | 'services';

export interface VoucherRedemption {
  id: string;
  userId: string;
  voucherId: string;
  voucherCode: string;
  pointsUsed: number;
  status: 'active' | 'used' | 'expired';
  redeemedAt: string;
  expiresAt: string;
  usedAt?: string;
  voucher?: Voucher;
}

export interface UserTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'bonus';
  points: number;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Predefined vouchers as per your requirements
export const availableVouchers: Voucher[] = [
  // 🛒 Shopping Discounts
  {
    id: 'amazon-50',
    category: 'shopping',
    brand: 'Amazon',
    title: '₹50 OFF on Amazon',
    description: '₹50 off on any order above ₹500',
    pointsRequired: 500,
    originalValue: 50,
    discountType: 'fixed',
    discountValue: 50,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    color: '#FF9900',
    validityDays: 30,
    termsAndConditions: [
      'Valid on orders above ₹500',
      'Cannot be combined with other offers',
      'Valid for 30 days from redemption',
      'Applicable on all categories except gift cards'
    ],
    isActive: true,
    stockLimit: 100,
    currentStock: 85
  },
  {
    id: 'flipkart-10percent',
    category: 'shopping',
    brand: 'Flipkart',
    title: '10% OFF on Flipkart',
    description: '10% discount up to ₹200 on any order',
    pointsRequired: 400,
    originalValue: 200,
    discountType: 'percentage',
    discountValue: 10,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
    logo: 'https://logos-world.net/wp-content/uploads/2020/11/Flipkart-Logo.png',
    color: '#047BD6',
    validityDays: 45,
    termsAndConditions: [
      'Maximum discount ₹200',
      'Valid on all categories',
      'Cannot be clubbed with ongoing offers',
      'Valid for 45 days'
    ],
    isActive: true,
    stockLimit: 150,
    currentStock: 120
  },
  {
    id: 'myntra-5percent',
    category: 'shopping',
    brand: 'Myntra',
    title: '5% OFF on Myntra',
    description: '5% discount on fashion and lifestyle',
    pointsRequired: 300,
    originalValue: 150,
    discountType: 'percentage',
    discountValue: 5,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=200&fit=crop',
    logo: 'https://logos-world.net/wp-content/uploads/2020/11/Myntra-Logo.png',
    color: '#EE5A52',
    validityDays: 60,
    termsAndConditions: [
      'Valid on fashion and lifestyle products',
      'Minimum order value ₹999',
      'Valid for 60 days',
      'Excludes sale items'
    ],
    isActive: true,
    stockLimit: 200,
    currentStock: 180
  },

  // 🍕 Food & Beverages
  {
    id: 'dominos-free-pizza',
    category: 'food',
    brand: "Domino's",
    title: "Free Domino's Pizza",
    description: 'Get a free regular pizza of your choice',
    pointsRequired: 1000,
    originalValue: 299,
    discountType: 'free',
    discountValue: 299,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=200&fit=crop',
    logo: 'https://logos-world.net/wp-content/uploads/2020/11/Dominos-Logo.png',
    color: '#0078AE',
    validityDays: 15,
    termsAndConditions: [
      'Valid on regular size pizzas only',
      'Dine-in and takeaway only',
      'Cannot be combined with other offers',
      'Valid for 15 days'
    ],
    isActive: true,
    stockLimit: 50,
    currentStock: 32
  },
  {
    id: 'swiggy-20percent',
    category: 'food',
    brand: 'Swiggy',
    title: '20% OFF on Swiggy',
    description: '20% discount up to ₹100 on food orders',
    pointsRequired: 600,
    originalValue: 100,
    discountType: 'percentage',
    discountValue: 20,
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=200&fit=crop',
    logo: 'https://logos-world.net/wp-content/uploads/2020/11/Swiggy-Logo.png',
    color: '#FC8019',
    validityDays: 30,
    termsAndConditions: [
      'Maximum discount ₹100',
      'Valid on food orders only',
      'Minimum order value ₹199',
      'Valid for 30 days'
    ],
    isActive: true,
    stockLimit: 200,
    currentStock: 165
  },
  {
    id: 'ccd-free-coffee',
    category: 'food',
    brand: 'Café Coffee Day',
    title: 'Free Coffee at CCD',
    description: 'Get a free regular coffee of your choice',
    pointsRequired: 350,
    originalValue: 120,
    discountType: 'free',
    discountValue: 120,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop',
    logo: 'https://logos-world.net/wp-content/uploads/2021/02/Cafe-Coffee-Day-Logo.png',
    color: '#7B3F00',
    validityDays: 21,
    termsAndConditions: [
      'Valid on regular coffee varieties',
      'One voucher per visit',
      'Valid at all CCD outlets',
      'Valid for 21 days'
    ],
    isActive: true,
    stockLimit: 150,
    currentStock: 98
  },

  // 🚕 Travel & Transport
  {
    id: 'uber-100-discount',
    category: 'travel',
    brand: 'Uber',
    title: '₹100 Uber Ride Discount',
    description: '₹100 off on your next Uber ride',
    pointsRequired: 800,
    originalValue: 100,
    discountType: 'fixed',
    discountValue: 100,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=200&fit=crop',
    logo: 'https://logos-world.net/wp-content/uploads/2020/05/Uber-Logo.png',
    color: '#000000',
    validityDays: 30,
    termsAndConditions: [
      'Valid on UberGo and UberX',
      'Maximum one voucher per ride',
      'Valid in all cities',
      'Valid for 30 days'
    ],
    isActive: true,
    stockLimit: 100,
    currentStock: 73
  },
  {
    id: 'ola-coupons',
    category: 'travel',
    brand: 'Ola',
    title: 'Ola Ride Coupons',
    description: '₹75 off on Ola rides (Pack of 2)',
    pointsRequired: 500,
    originalValue: 150,
    discountType: 'fixed',
    discountValue: 75,
    image: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=400&h=200&fit=crop',
    logo: 'https://logos-world.net/wp-content/uploads/2020/11/Ola-Logo.png',
    color: '#C0DF16',
    validityDays: 45,
    termsAndConditions: [
      'Pack contains 2 coupons of ₹75 each',
      'Valid on all ride categories',
      'Cannot be combined with other offers',
      'Valid for 45 days'
    ],
    isActive: true,
    stockLimit: 80,
    currentStock: 54
  },

  // 🌱 Eco-friendly Stores
  {
    id: 'green-store-bottles',
    category: 'eco-friendly',
    brand: 'Green Store',
    title: '15% OFF Reusable Bottles',
    description: '15% discount on eco-friendly reusable bottles',
    pointsRequired: 450,
    originalValue: 200,
    discountType: 'percentage',
    discountValue: 15,
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=200&fit=crop',
    logo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100&h=100&fit=crop',
    color: '#22C55E',
    validityDays: 60,
    termsAndConditions: [
      'Valid on all reusable bottles',
      'Minimum purchase ₹500',
      'Valid at all Green Store outlets',
      'Valid for 60 days'
    ],
    isActive: true,
    stockLimit: 120,
    currentStock: 89
  },
  {
    id: 'eco-bags-discount',
    category: 'eco-friendly',
    brand: 'EcoLife',
    title: 'Eco-friendly Bags Discount',
    description: 'Discount on cloth bags & bamboo products',
    pointsRequired: 350,
    originalValue: 150,
    discountType: 'fixed',
    discountValue: 100,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=200&fit=crop',
    logo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100&h=100&fit=crop',
    color: '#059669',
    validityDays: 90,
    termsAndConditions: [
      'Valid on cloth bags and bamboo products',
      'Minimum purchase ₹300',
      'Free delivery on orders above ₹499',
      'Valid for 90 days'
    ],
    isActive: true,
    stockLimit: 200,
    currentStock: 156
  }
];

// Category configurations
export const voucherCategories = {
  shopping: {
    title: 'Shopping Discounts',
    icon: '🛒',
    color: '#3B82F6',
    bgColor: 'from-blue-500/10 to-blue-600/20'
  },
  food: {
    title: 'Food & Beverages',
    icon: '🍕',
    color: '#F59E0B',
    bgColor: 'from-amber-500/10 to-orange-600/20'
  },
  travel: {
    title: 'Travel & Transport',
    icon: '🚕',
    color: '#8B5CF6',
    bgColor: 'from-purple-500/10 to-purple-600/20'
  },
  'eco-friendly': {
    title: 'Eco-friendly Stores',
    icon: '🌱',
    color: '#10B981',
    bgColor: 'from-green-500/10 to-emerald-600/20'
  },
  entertainment: {
    title: 'Entertainment',
    icon: '🎬',
    color: '#EF4444',
    bgColor: 'from-red-500/10 to-red-600/20'
  },
  services: {
    title: 'Services',
    icon: '🛠️',
    color: '#6366F1',
    bgColor: 'from-indigo-500/10 to-indigo-600/20'
  }
};

// Voucher management functions
export const getVouchersByCategory = (category: VoucherCategory): Voucher[] => {
  return availableVouchers.filter(voucher => 
    voucher.category === category && voucher.isActive
  );
};

export const getAvailableVouchers = (userPoints: number): Voucher[] => {
  return availableVouchers.filter(voucher => 
    voucher.isActive && 
    voucher.pointsRequired <= userPoints &&
    (voucher.currentStock === undefined || voucher.currentStock > 0)
  );
};

export const canRedeemVoucher = (voucher: Voucher, userPoints: number): boolean => {
  return userPoints >= voucher.pointsRequired &&
         voucher.isActive &&
         (voucher.currentStock === undefined || voucher.currentStock > 0);
};

export const generateVoucherCode = (voucherId: string): string => {
  const prefix = voucherId.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const calculateVoucherValue = (voucher: Voucher): string => {
  switch (voucher.discountType) {
    case 'percentage':
      return `${voucher.discountValue}% OFF`;
    case 'fixed':
      return `₹${voucher.discountValue} OFF`;
    case 'free':
      return 'FREE';
    default:
      return `₹${voucher.originalValue} VALUE`;
  }
};

// Mock functions for voucher operations (to be replaced with Supabase operations)
export const redeemVoucher = async (
  voucherId: string, 
  userId: string, 
  userPoints: number
): Promise<VoucherRedemption> => {
  const voucher = availableVouchers.find(v => v.id === voucherId);
  if (!voucher) {
    throw new Error('Voucher not found');
  }

  if (!canRedeemVoucher(voucher, userPoints)) {
    throw new Error('Insufficient points or voucher unavailable');
  }

  // Generate unique voucher code
  const voucherCode = generateVoucherCode(voucherId);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + voucher.validityDays);

  const redemption: VoucherRedemption = {
    id: `redemption_${Date.now()}`,
    userId,
    voucherId,
    voucherCode,
    pointsUsed: voucher.pointsRequired,
    status: 'active',
    redeemedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    voucher
  };

  // Update stock (in real implementation, this would be done in database)
  if (voucher.currentStock !== undefined) {
    voucher.currentStock--;
  }

  return redemption;
};

export const getUserRedemptions = async (userId: string): Promise<VoucherRedemption[]> => {
  // Mock data - in real implementation, fetch from Supabase
  return [
    {
      id: 'redemption_1',
      userId,
      voucherId: 'ccd-free-coffee',
      voucherCode: 'CCD123456ABCD',
      pointsUsed: 350,
      status: 'active',
      redeemedAt: '2024-01-15T10:30:00Z',
      expiresAt: '2024-02-05T10:30:00Z',
      voucher: availableVouchers.find(v => v.id === 'ccd-free-coffee')
    }
  ];
};

export const getUserTransactions = async (userId: string): Promise<UserTransaction[]> => {
  // Mock data - in real implementation, fetch from Supabase
  return [
    {
      id: 'txn_1',
      userId,
      type: 'earned',
      points: 15,
      description: 'Classified recyclable waste',
      createdAt: '2024-01-15T08:00:00Z'
    },
    {
      id: 'txn_2',
      userId,
      type: 'earned',
      points: 10,
      description: 'Classified biodegradable waste',
      createdAt: '2024-01-15T09:15:00Z'
    },
    {
      id: 'txn_3',
      userId,
      type: 'redeemed',
      points: -350,
      description: 'Redeemed: Free Coffee at CCD',
      metadata: { voucherCode: 'CCD123456ABCD' },
      createdAt: '2024-01-15T10:30:00Z'
    }
  ];
};

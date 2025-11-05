/**
 * Quilox Nightclub App Theme
 */

import { Platform } from 'react-native';

// Quilox Brand Colors
export const QuiloxColors = {
  primary: '#D4AF37', // Gold
  secondary: '#C0C0C0', // Silver
  black: '#000000',
  white: '#FFFFFF',
  red: '#DC143C', // Quilox Red
  darkGray: '#1A1A1A',
  mediumGray: '#2A2A2A',
  lightGray: '#3A3A3A',
  gold: '#FFD700',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

const tintColorLight = QuiloxColors.primary;
const tintColorDark = QuiloxColors.gold;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: QuiloxColors.white,
    background: QuiloxColors.black,
    tint: tintColorDark,
    icon: QuiloxColors.lightGray,
    tabIconDefault: '#666',
    tabIconSelected: QuiloxColors.gold,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Types
export type MembershipTier = 'standard' | 'silver' | 'gold' | 'platinum';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipTier: MembershipTier;
  bookingCount: number;
  loyaltyPoints: number;
  walletBalance: number;
  isPriveMember: boolean;
}

export interface Booking {
  id: string;
  tableNumber: string;
  section: 'VIP' | 'Regular' | 'Privé';
  date: string;
  time: string;
  guests: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  totalAmount: number;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
}

export interface FeedPost {
  id: string;
  username: string;
  userAvatar: string;
  location: string;
  image: string;
  caption: string;
  likes: number;
  timeAgo: string;
  comments: FeedComment[];
  verified: boolean;
}

export interface FeedComment {
  id: string;
  username: string;
  text: string;
  timeAgo: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'drinks' | 'bottles' | 'food' | 'packages';
  price: number;
  image: string;
  description: string;
  isPriveExclusive?: boolean;
}

export interface Benefit {
  title: string;
  description: string;
}


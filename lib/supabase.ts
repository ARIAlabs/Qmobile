import { logger } from '@/utils/logger';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { ApiResponse, ApiResponseBuilder } from './api-response';

// Types for our data models
export interface CarouselItem {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MerchProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  old_price?: number;
  category: string;
  rating?: number;
  reviews_count?: number;
  image_url: string;
  stock_quantity: number;
  is_available: boolean;
  is_exclusive?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedPost {
  id: string;
  title: string;
  caption: string; // This will be mapped from the 'description' column
  image_url: string;
  description: string; // The actual column name in the database
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
  likes_count?: number;
  comments_count?: number;
}

// Booking-related types
export interface TableArea {
  id: string;
  name: string;
  table_number: string;
  section: 'VIP' | 'Regular' | 'Privé';
  seats: number;
  booking_fee: number;
  image_url: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string | null;
  table_id: string;
  booking_date: string;
  guest_count: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  booking_fee: number;
  created_at: string;
  updated_at: string;
}

export interface BookingWithTable extends Booking {
  table: TableArea;
}

// User profile and wallet types
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWallet {
  id: string;
  user_id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  balance: number;
  currency: string;
  status: 'active' | 'inactive' | 'suspended';
  is_prive_qualified: boolean;
  prive_qualified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Supabase client configuration
// Environment variables with fallbacks for development
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ucfnieiloumpxgfhhjip.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZm5pZWlsb3VtcHhnZmhoamlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTMzNjksImV4cCI6MjA3NTU4OTM2OX0.8DMPgvinfI97lD8yP4Clk0CWVLxaS9M4oZzf_dQJZVg';

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your .env file.');
}

// Log environment info using the logger
logger.logEnvironment();
logger.info('Supabase URL:', supabaseUrl);

/**
 * Secure storage implementation using Expo SecureStore
 * Provides hardware-backed encryption for sensitive data:
 * - iOS: Keychain (AES-256)
 * - Android: KeyStore System (AES-256)
 * - Web: localStorage (fallback, not encrypted)
 */
const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      // Web fallback to localStorage
      return localStorage.getItem(key);
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      // Web fallback to localStorage
      localStorage.setItem(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      // Web fallback to localStorage
      localStorage.removeItem(key);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: __DEV__, // Use __DEV__ to avoid circular dependency
  },
});

/**
 * Fetches active carousel items sorted by display order
 * @returns ApiResponse with carousel items or error
 */
export const fetchCarousel = async (): Promise<ApiResponse<CarouselItem[]>> => {
  return ApiResponseBuilder.handleRequest(async () => {
    const { data, error } = await supabase
      .from('mobile_carousel')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  });
};

/**
 * Fetches active carousel items sorted by display order (Legacy - returns data only)
 * @deprecated Use fetchCarousel() for standardized response
 */
export const fetchCarouselLegacy = async (): Promise<CarouselItem[]> => {
  const { data, error } = await supabase
    .from('mobile_carousel')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching carousel:', error);
    return [];
  }
  return data || [];
};

/**
 * Subscribes to carousel changes
 * @param callback Function to call when carousel data changes
 * @returns Unsubscribe function
 */
export const subscribeToCarousel = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('mobile_carousel_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mobile_carousel',
      },
      (payload) => {
        console.log('Carousel updated:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Fetches available merchandise products
 */
export const fetchMerchProducts = async (): Promise<MerchProduct[]> => {
  const { data, error } = await supabase
    .from('merch_products')
    .select('*')
    .eq('is_available', true);

  if (error) {
    console.error('Error fetching merch products:', error);
    return [];
  }
  return data || [];
};

/**
 * Get the full public URL for a storage file
 */
const getPublicImageUrl = (path: string): string => {
  if (!path) return '';
  // If it's already a full URL, return as is
  if (path.startsWith('http')) return path;
  // Otherwise, construct the URL from the storage path
  const { data } = supabase.storage
    .from('gallery-photos')
    .getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Fetches active feed posts, most recent first
 */
export const fetchFeedPosts = async (): Promise<FeedPost[]> => {
  console.log('Fetching active feed posts from fees_posts table...');
  const { data, error } = await supabase
    .from('fees_posts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feed posts:', error);
    return [];
  }
  
  console.log('Raw feed posts data from database:', JSON.stringify(data, null, 2));
  
  return (data || []).map(post => {
    const fullImageUrl = getPublicImageUrl(post.image_url);
    console.log(`Processing post ${post.id}:`, {
      title: post.title,
      description: post.description,
      image_url: { original: post.image_url, full: fullImageUrl },
      allFields: Object.keys(post)
    });
    
    // Clean up the caption by removing the auto-generated 'Feed Post 2025-11...' prefix
    const cleanDescription = (post.description || '').replace(/^Feed Post \d{4}-\d{2}-\d{2}[^\w]*/i, '').trim();
    
    return {
      ...post,
      // Ensure all required fields have default values
      title: post.title || 'Quilox',
      caption: cleanDescription,
      image_url: fullImageUrl,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
    };
  });
};

// Mock data for table areas (fallback if database not set up)
const MOCK_TABLE_AREAS: TableArea[] = [
  {
    id: '1',
    name: 'COA 1',
    table_number: 'Table #1',
    section: 'VIP',
    seats: 8,
    booking_fee: 50000,
    image_url: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'COA 2',
    table_number: 'Table #2',
    section: 'VIP',
    seats: 6,
    booking_fee: 40000,
    image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Upper Deck 1',
    table_number: 'Table #3',
    section: 'Regular',
    seats: 10,
    booking_fee: 35000,
    image_url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Playboy Room 1',
    table_number: 'Table #4',
    section: 'Privé',
    seats: 12,
    booking_fee: 150000,
    image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400',
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Fetches all available table areas
 */
export const fetchTableAreas = async (): Promise<TableArea[]> => {
  console.log('Fetching table areas...');
  
  try {
    const { data, error } = await supabase
      .from('table_areas')
      .select('*')
      .order('section', { ascending: true })
      .order('table_number', { ascending: true });

    if (error) {
      console.log('📋 Table areas table not found, using mock data:', error.message);
      return MOCK_TABLE_AREAS;
    }

    if (!data || data.length === 0) {
      console.log('📋 No table areas in database, using mock data');
      return MOCK_TABLE_AREAS;
    }
  
    console.log('Fetched table areas from database:', data.length);
    return data;
  } catch (err) {
    console.log('📋 Exception fetching table areas (using mock data):', err);
    return MOCK_TABLE_AREAS;
  }
};

/**
 * Checks table availability for a specific date
 */
export const checkTableAvailability = async (
  tableId: string,
  bookingDate: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('table_id', tableId)
    .eq('booking_date', bookingDate)
    .in('status', ['pending', 'confirmed']);

  if (error) {
    console.error('Error checking availability:', error);
    return false;
  }

  // If no bookings found, table is available
  return (data || []).length === 0;
};

/**
 * Creates a new booking
 */
export const createBooking = async (
  bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; booking?: Booking; error?: string }> => {
  console.log('Creating booking:', bookingData);
  
  // First check if table is available
  const isAvailable = await checkTableAvailability(
    bookingData.table_id,
    bookingData.booking_date
  );

  if (!isAvailable) {
    return {
      success: false,
      error: 'Table is not available for the selected date',
    };
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  console.log('Booking created successfully:', data);
  return {
    success: true,
    booking: data,
  };
};

/**
 * Fetches user bookings
 */
export const fetchUserBookings = async (
  userId?: string
): Promise<BookingWithTable[]> => {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      table:table_areas(*)
    `)
    .order('booking_date', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  return data || [];
};

/**
 * Cancels a booking
 */
export const cancelBooking = async (
  bookingId: string
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (error) {
    console.error('Error cancelling booking:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
};

// Version-related functions removed - implement in api-version.ts if needed

// Export compliance utilities
export {
  COMPLIANCE_CONSTANTS, complianceManager, DataCategory, DataSubjectRight, handleDataSubjectRequest, isOperationAllowed, LegalBasis, requestUserConsent
} from './compliance';

// API Version constant (inline for now)
export const API_VERSION = '1.0.0';

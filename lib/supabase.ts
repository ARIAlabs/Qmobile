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

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string | null;
  username: string;
  avatar_url: string | null;
  text: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches comments for a specific post
 */
export const fetchPostComments = async (postId: string): Promise<PostComment[]> => {
  console.debug(`Fetching comments for post ${postId}...`);
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
  
  return data || [];
};

/**
 * Creates a new comment on a post
 */
export const createComment = async (
  postId: string,
  text: string,
  username: string = 'Anonymous'
): Promise<{ success: boolean; comment?: PostComment; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  

  const commentData = {
    post_id: postId,
    user_id: user?.id || null,
    username: username,
    avatar_url: `https://i.pravatar.cc/40?u=${user?.id || Math.random()}`,
    text: text.trim(),
  };

  const { data, error } = await supabase
    .from('post_comments')
    .insert([commentData])
    .select()
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  // Also increment the comments_count on the post
  await supabase.rpc('increment_post_comments', { post_id: postId });

  return {
    success: true,
    comment: data,
  };
};

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
  payment_reference?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  metadata?: any;
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

// Supabase client configuration with fallback for development
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ucfnieiloumpxgfhhjip.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjZm5pZWlsb3VtcHhnZmhoamlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTMzNjksImV4cCI6MjA3NTU4OTM2OX0.8DMPgvinfI97lD8yP4Clk0CWVLxaS9M4oZzf_dQJZVg';

if (__DEV__) {
  console.log('✅ Supabase initialized:', supabaseUrl);
}

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
      // Web fallback to localStorage (only in browser, not SSR)
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
      return null;
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
      // Web fallback to localStorage (only in browser, not SSR)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
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
      // Web fallback to localStorage (only in browser, not SSR)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
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
        console.debug('Carousel updated:', payload);
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
  console.debug('Fetching active feed posts from fees_posts table...');
  const { data, error } = await supabase
    .from('fees_posts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feed posts:', error);
    return [];
  }
  
  console.debug('Raw feed posts data from database:', JSON.stringify(data, null, 2));
  
  return (data || []).map(post => {
    const fullImageUrl = getPublicImageUrl(post.image_url);
    console.debug(`Processing post ${post.id}:`, {
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
  console.debug('Fetching table areas...');
  
  try {
    const { data, error } = await supabase
      .from('table_areas')
      .select('*')
      .order('section', { ascending: true })
      .order('table_number', { ascending: true });

    if (error) {
      console.warn('📋 Table areas table not found, using mock data:', error.message);
      return MOCK_TABLE_AREAS;
    }

    if (!data || data.length === 0) {
      console.warn('📋 No table areas in database, using mock data');
      return MOCK_TABLE_AREAS;
    }
  
    console.debug('Fetched table areas from database:', data.length);
    return data;
  } catch (err) {
    console.warn('📋 Exception fetching table areas (using mock data):', err);
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
  console.info('Creating booking:', bookingData);
  
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

  console.info('Booking created successfully:', data);
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
 * Verifies a Paystack transaction
 */
export const verifyPaystackTransaction = async (
  reference: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const secretKey = process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    console.info('Verifying Paystack transaction:', reference);

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (result.status === true && result.data?.status === 'success') {
      console.info('Payment verification successful:', result.data.reference);
      return {
        success: true,
        data: result.data,
      };
    }

    console.warn('Payment verification failed:', result);
    return {
      success: false,
      error: result.message || 'Payment verification failed',
    };
  } catch (error: any) {
    console.error('Error verifying transaction:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify payment',
    };
  }
};

/**
 * Verifies a wallet top-up payment and updates the balance
 * Uses atomic update to prevent double-counting from webhook + client-side
 */
// Module-level lock to prevent concurrent processing
const PROCESSING_REFS = new Set<string>();

export const verifyAndUpdateWalletTopUp = async (
  reference: string,
  walletId: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
  // FIRST LINE OF DEFENSE: Module-level lock (synchronous check)
  if (PROCESSING_REFS.has(reference)) {
    console.info('=== BLOCKED: Reference already being processed ===', reference);
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('id', walletId)
      .single();
    return { success: true, newBalance: wallet?.balance || 0 };
  }
  
  // Acquire lock immediately
  PROCESSING_REFS.add(reference);
  
  try {
    console.info('=== TOP-UP: Processing ===', reference);

    // Check if transaction exists and get its current status
    const { data: tx, error: txError } = await supabase
      .from('wallet_transactions')
      .select('id, amount, status')
      .eq('reference', reference)
      .single();

    if (txError || !tx) {
      console.error('=== TOP-UP: Transaction not found ===', txError);
      return { success: false, error: 'Transaction not found' };
    }

    // If already completed, just return current balance
    if (tx.status === 'completed') {
      console.info('=== SKIP: Transaction already completed ===');
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('id', walletId)
        .single();
      return { success: true, newBalance: wallet?.balance || 0 };
    }

    const amount = tx.amount || 0;
    if (amount <= 0) {
      return { success: false, error: 'Invalid transaction amount' };
    }

    // Verify payment with Paystack
    const verificationResult = await verifyPaystackTransaction(reference);
    if (!verificationResult.success) {
      console.error('=== TOP-UP: Paystack verification failed ===');
      return { success: false, error: 'Payment verification failed' };
    }

    // Get current wallet balance and loyalty points
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance, loyalty_points')
      .eq('id', walletId)
      .single();

    if (walletError) {
      console.error('=== TOP-UP: Failed to fetch wallet ===', walletError);
      return { success: false, error: 'Wallet not found' };
    }

    const oldBalance = wallet?.balance || 0;
    const newBalance = oldBalance + amount;
    
    // Calculate loyalty points: 1 point per ₦100 topped up
    const earnedPoints = Math.floor(amount / 100);
    const currentPoints = wallet?.loyalty_points || 0;
    const newPoints = currentPoints + earnedPoints;
    
    console.info('=== TOP-UP:', oldBalance, '+', amount, '=', newBalance);
    console.info('=== POINTS:', currentPoints, '+', earnedPoints, '=', newPoints);

    // ATOMIC: Update both transaction status AND wallet balance
    // First mark transaction as completed
    const { error: txUpdateError } = await supabase
      .from('wallet_transactions')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('reference', reference)
      .eq('status', 'pending'); // Only if still pending

    if (txUpdateError) {
      console.error('=== TOP-UP: Failed to mark completed ===', txUpdateError);
    }

    // Update wallet balance and loyalty points
    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({ 
        balance: newBalance,
        loyalty_points: newPoints,
        updated_at: new Date().toISOString() 
      })
      .eq('id', walletId);

    if (updateError) {
      console.error('=== TOP-UP: Failed to update balance ===', updateError);
      return { success: false, error: 'Failed to update wallet balance' };
    }

    console.info('=== TOP-UP SUCCESS: Balance =', newBalance, ', Points =', newPoints, '===');
    return { success: true, newBalance };
  } catch (error: any) {
    console.error('Top-up error:', error);
    return { success: false, error: error.message };
  } finally {
    // Keep the reference in the set permanently to prevent any future attempts
    // Don't remove: PROCESSING_REFS.delete(reference);
  }
};

/**
 * Creates a booking with payment reference after successful payment
 */
export const createBookingWithPayment = async (
  bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>,
  paymentReference: string,
  paystackReference: string
): Promise<{ success: boolean; booking?: Booking; error?: string }> => {
  try {
    console.info('Creating booking with payment:', { paymentReference, table: bookingData.table_id });

    // Check if table is available
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

    // Create booking with confirmed status (since payment is successful)
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        ...bookingData,
        status: 'confirmed',
        payment_reference: paymentReference,
        payment_status: 'paid',
        metadata: {
          paystack_reference: paystackReference,
          payment_method: 'paystack',
          paid_at: new Date().toISOString(),
        },
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating booking with payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.info('Booking created successfully with payment:', data.id);
    return {
      success: true,
      booking: data,
    };
  } catch (error: any) {
    console.error('Error creating booking with payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to create booking',
    };
  }
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

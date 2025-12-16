/**
 * Wallet Manager
 * Manages virtual account creation, prive qualification, and wallet operations
 */

import { config } from '@/config/environment';
import { paystackClient } from './paystack';
import { supabase } from './supabase';

// ==================== DATABASE TYPES ====================

export interface UserWallet {
  id: string;
  user_id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  balance: number;
  loyalty_points: number;
  currency: string;
  status: 'active' | 'inactive' | 'suspended';
  is_prive_qualified: boolean;
  prive_qualified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriveQualification {
  qualifies: boolean;
  bookingCount: number;
  requiredBookings: number;
  nextMilestone?: number;
}

// ==================== WALLET MANAGER CLASS ====================

class WalletManager {
  private walletCreationLocks: Map<string, Promise<UserWallet | null>> = new Map();

  /**
   * Check if user has Privé membership (wallet exists)
   * No longer requires booking count - users can upgrade anytime
   */
  async checkPriveQualification(userId: string): Promise<PriveQualification> {
    try {
      console.debug('Checking prive status for user:', userId);

      // Check if user already has a wallet (is a Privé member)
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('id')
        .eq('user_id', userId)
        .single();

      const isPriveMember = !!wallet;

      console.info('Prive status check:', { userId, isPriveMember });

      return {
        qualifies: isPriveMember,
        bookingCount: 0, // No longer used
        requiredBookings: 0, // No longer required
        nextMilestone: undefined,
      };
    } catch (error: any) {
      console.error('Failed to check prive status:', error);
      return {
        qualifies: false,
        bookingCount: 0,
        requiredBookings: 0,
      };
    }
  }

  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string): Promise<UserWallet | null> {
    // Check if there's already a wallet creation in progress for this user
    const existingLock = this.walletCreationLocks.get(userId);
    if (existingLock) {
      console.debug('Wallet creation already in progress, waiting...');
      return existingLock;
    }

    // Create a new promise for this wallet creation
    const creationPromise = this.createWalletInternal(userId);
    this.walletCreationLocks.set(userId, creationPromise);

    try {
      const wallet = await creationPromise;
      return wallet;
    } finally {
      // Clean up the lock after creation completes or fails
      this.walletCreationLocks.delete(userId);
    }
  }

  /**
   * Internal wallet creation logic
   */
  private async createWalletInternal(userId: string): Promise<UserWallet | null> {
    try {
      // Check if wallet already exists
      const existingWallet = await this.getWallet(userId);
      if (existingWallet) {
        console.debug('Existing wallet found for user:', userId);
        return existingWallet;
      }

      // Check prive qualification
      const qualification = await this.checkPriveQualification(userId);
      if (!qualification.qualifies) {
        console.info('User not qualified for prive wallet:', {
          userId,
          bookingCount: qualification.bookingCount,
          required: qualification.requiredBookings,
        });
        return null;
      }

      // Get user details
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user profile for additional details
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Check if user has completed Privé onboarding
      if (!profile?.prive_onboarded) {
        console.info('User has not completed Privé onboarding yet:', userId);
        return null;
      }

      // Validate required fields from onboarding
      if (!profile.bvn || !profile.phone || !profile.first_name || !profile.last_name) {
        console.warn('User profile missing required fields for wallet creation');
        return null;
      }

      const accountRequest = {
        userId,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: user.email || '',
        phone: profile.phone,
      };

      console.info('Creating virtual account:', accountRequest);

      const accountResponse = await paystackClient.createDedicatedAccount(accountRequest);

      // Handle Paystack account creation result
      let accountData;
      if (!accountResponse.success || !accountResponse.data) {
        // Only allow mock accounts in development
        if (config.isProduction) {
          console.error('Paystack account creation failed in production:', accountResponse.error);
          throw new Error('Failed to create virtual account. Please try again later.');
        }
        
        console.warn('Paystack account creation failed, using mock account for testing:', accountResponse.error);
        accountData = {
          accountNumber: `MOCK${Date.now()}`,
          accountName: `${accountRequest.firstName} ${accountRequest.lastName}`,
          bankName: 'Mock Bank (Dev Mode)',
          bankCode: 'MOCK001',
          reference: `mock-${userId}`,
        };
      } else {
        accountData = accountResponse.data;
      }

      // Save wallet to database
      const { data: wallet, error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          account_number: accountData.accountNumber,
          account_name: accountData.accountName,
          bank_name: accountData.bankName,
          bank_code: accountData.bankCode,
          balance: 0,
          currency: 'NGN',
          status: 'active',
          is_prive_qualified: true,
          prive_qualified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // If duplicate key error, it means wallet was created by another concurrent call
        if (error.code === '23505') {
          console.warn('Wallet already exists (race condition), fetching existing wallet');
          const existingWallet = await this.getWallet(userId);
          if (existingWallet) {
            return existingWallet;
          }
        }
        console.error('Failed to save wallet to database:', error);
        throw error;
      }

      console.info('Wallet created successfully:', wallet);
      return wallet;
    } catch (error: any) {
      console.error('Failed to get or create wallet:', error);
      return null;
    }
  }

  /**
   * Get existing wallet for user
   */
  async getWallet(userId: string): Promise<UserWallet | null> {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching wallet:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Failed to fetch wallet:', error);
      return null;
    }
  }

  async getWalletBalance(accountNumber: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('account_number', accountNumber)
        .single();

      if (error) {
        console.error('Failed to fetch wallet balance from database:', error);
        return 0;
      }

      return data?.balance || 0;
    } catch (error: any) {
      console.error('Failed to get wallet balance:', error);
      return 0;
    }
  }

  /**
   * Refresh wallet data
   */
  async refreshWallet(userId: string): Promise<UserWallet | null> {
    const wallet = await this.getWallet(userId);
    if (!wallet) return null;

    const balance = await this.getWalletBalance(wallet.account_number);
    
    return {
      ...wallet,
      balance,
    };
  }
}

// Export singleton instance
export const walletManager = new WalletManager();
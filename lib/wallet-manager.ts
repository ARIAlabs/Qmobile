/**
 * Wallet Manager
 * Manages virtual account creation, prive qualification, and wallet operations
 */

import { logger } from '@/utils/logger';
import { globusBankClient, type CreateAccountRequest } from './globus-bank';
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
  private readonly REQUIRED_BOOKINGS = 5;

  /**
   * Check if user qualifies for prive membership (5+ bookings)
   */
  async checkPriveQualification(userId: string): Promise<PriveQualification> {
    try {
      logger.debug('Checking prive qualification for user:', userId);

      // Count user's confirmed bookings
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['confirmed', 'completed']);

      if (error) {
        logger.error('Error counting bookings:', error);
        return {
          qualifies: false,
          bookingCount: 0,
          requiredBookings: this.REQUIRED_BOOKINGS,
        };
      }

      const bookingCount = count || 0;
      const qualifies = bookingCount >= this.REQUIRED_BOOKINGS;

      logger.info('Prive qualification check:', { userId, bookingCount, qualifies });

      return {
        qualifies,
        bookingCount,
        requiredBookings: this.REQUIRED_BOOKINGS,
        nextMilestone: qualifies ? undefined : this.REQUIRED_BOOKINGS - bookingCount,
      };
    } catch (error: any) {
      logger.error('Failed to check prive qualification:', error);
      return {
        qualifies: false,
        bookingCount: 0,
        requiredBookings: this.REQUIRED_BOOKINGS,
      };
    }
  }

  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string): Promise<UserWallet | null> {
    try {
      // Check if wallet already exists
      const existingWallet = await this.getWallet(userId);
      if (existingWallet) {
        logger.debug('Existing wallet found for user:', userId);
        return existingWallet;
      }

      // Check prive qualification
      const qualification = await this.checkPriveQualification(userId);
      if (!qualification.qualifies) {
        logger.info('User not qualified for prive wallet:', {
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

      // Create virtual account via Globus Bank
      const accountRequest: CreateAccountRequest = {
        userId,
        firstName: profile?.first_name || user.email?.split('@')[0] || 'Quilox',
        lastName: profile?.last_name || 'Member',
        email: user.email || '',
        phone: profile?.phone || '',
      };

      logger.info('Creating virtual account:', accountRequest);

      const accountResponse = await globusBankClient.createVirtualAccount(accountRequest);

      if (!accountResponse.success || !accountResponse.data) {
        throw new Error(accountResponse.error || 'Failed to create virtual account');
      }

      // Save wallet to database
      const { data: wallet, error } = await supabase
        .from('user_wallets')
        .insert([{
          user_id: userId,
          account_number: accountResponse.data.accountNumber,
          account_name: accountResponse.data.accountName,
          bank_name: accountResponse.data.bankName,
          bank_code: accountResponse.data.bankCode,
          balance: 0,
          currency: 'NGN',
          status: 'active',
          is_prive_qualified: true,
          prive_qualified_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        logger.error('Failed to save wallet to database:', error);
        throw error;
      }

      logger.info('Wallet created successfully:', wallet);
      return wallet;
    } catch (error: any) {
      logger.error('Failed to get or create wallet:', error);
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
        logger.error('Error fetching wallet:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      logger.error('Failed to fetch wallet:', error);
      return null;
    }
  }

  /**
   * Get real-time balance from Globus Bank
   */
  async getWalletBalance(accountNumber: string): Promise<number> {
    try {
      const balanceResponse = await globusBankClient.getBalance(accountNumber);

      if (!balanceResponse.success || !balanceResponse.data) {
        throw new Error(balanceResponse.error || 'Failed to fetch balance');
      }

      const balance = balanceResponse.data.availableBalance;

      // Update balance in database
      await supabase
        .from('user_wallets')
        .update({ balance, updated_at: new Date().toISOString() })
        .eq('account_number', accountNumber);

      return balance;
    } catch (error: any) {
      logger.error('Failed to get wallet balance:', error);
      return 0;
    }
  }

  /**
   * Refresh wallet data from Globus Bank
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
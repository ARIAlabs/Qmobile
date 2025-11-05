/**
 * Wallet Hook
 * React hook for wallet operations in components
 */

import { supabase } from '@/lib/supabase';
import { walletManager, type PriveQualification, type UserWallet } from '@/lib/wallet-manager';
import { logger } from '@/utils/logger';
import { useCallback, useEffect, useState } from 'react';

export function useWallet() {
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [qualification, setQualification] = useState<PriveQualification | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load wallet and qualification status
   */
  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWallet(null);
        setQualification(null);
        return;
      }

      // Check prive qualification
      const qual = await walletManager.checkPriveQualification(user.id);
      setQualification(qual);

      // Get or create wallet if qualified
      if (qual.qualifies) {
        const walletData = await walletManager.getOrCreateWallet(user.id);
        setWallet(walletData);

        // Fetch real-time balance if wallet exists
        if (walletData) {
          const balance = await walletManager.getWalletBalance(walletData.account_number);
          setWallet({ ...walletData, balance });
        }
      } else {
        setWallet(null);
      }
    } catch (err: any) {
      logger.error('Failed to load wallet:', err);
      setError(err.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh wallet balance
   */
  const refreshBalance = useCallback(async () => {
    if (!wallet) return;

    try {
      setRefreshing(true);
      const balance = await walletManager.getWalletBalance(wallet.account_number);
      setWallet({ ...wallet, balance });
    } catch (err: any) {
      logger.error('Failed to refresh balance:', err);
    } finally {
      setRefreshing(false);
    }
  }, [wallet]);

  /**
   * Check if user can upgrade to prive
   */
  const canUpgrade = useCallback((): boolean => {
    return qualification?.qualifies === true && wallet === null;
  }, [qualification, wallet]);

  // Load wallet on mount
  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  return {
    wallet,
    qualification,
    loading,
    refreshing,
    error,
    loadWallet,
    refreshBalance,
    canUpgrade,
    isPriveMember: qualification?.qualifies || false,
  };
}
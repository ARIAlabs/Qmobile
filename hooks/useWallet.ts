/**
 * Wallet Hook
 * React hook for wallet operations in components
 */

import { supabase } from '@/lib/supabase';
import { walletManager, type PriveQualification, type UserWallet } from '@/lib/wallet-manager';
import { useCallback, useEffect, useState } from 'react';

export function useWallet() {
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [qualification, setQualification] = useState<PriveQualification | null>(null);
  const [priveOnboarded, setPriveOnboarded] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load wallet and qualification status
   */
  const loadWallet = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setWallet(null);
        setQualification(null);
        return;
      }

      console.info('🔄 Loading wallet for user:', user.id);

      // Check prive qualification
      const qual = await walletManager.checkPriveQualification(user.id);
      console.info('📊 Qualification result:', qual);
      setQualification(qual);

      // Check if user has completed Privé onboarding (has BVN set)
      const { data: profile } = await supabase
        .from('profiles')
        .select('prive_onboarded, bvn')
        .eq('id', user.id)
        .single();
      
      // User is onboarded if they have a valid 11-digit BVN
      const hasBvn = profile?.bvn && profile.bvn.length === 11;
      setPriveOnboarded(hasBvn || profile?.prive_onboarded || false);

      // Get or create wallet if qualified
      if (qual.qualifies) {
        console.info('✅ User qualifies for Privé, creating/fetching wallet');
        const walletData = await walletManager.getOrCreateWallet(user.id);
        setWallet(walletData);

        // Fetch real-time balance if wallet exists
        if (walletData) {
          // Skip balance fetch for mock accounts and Flutterwave sandbox
          // Flutterwave doesn't have a balance endpoint for virtual accounts
          // Balance is tracked via webhooks when deposits are received
          if (walletData.account_number.startsWith('MOCK') || walletData.bank_name === 'Mock Bank') {
            console.debug('Using database balance for sandbox/mock account');
            setWallet(walletData);
          } else {
            // For production accounts, balance would be fetched via transactions API
            console.debug('Using database balance (Flutterwave tracks via webhooks)');
            setWallet(walletData);
          }
        }
      } else {
        console.info('❌ User does not qualify for Privé yet');
        setWallet(null);
      }
    } catch (err: any) {
      console.error('Failed to load wallet:', err);
      setError(err.message || 'Failed to load wallet');
    } finally {
      setRefreshing(false);
    }
  }, []);

  /**
   * Refresh wallet (for pull-to-refresh)
   */
  const refreshWallet = useCallback(async () => {
    await loadWallet();
  }, [loadWallet]);

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
      console.error('Failed to refresh balance:', err);
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

  // Load wallet on mount (initial load only)
  useEffect(() => {
    setLoading(true);
    loadWallet().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    wallet,
    qualification,
    priveOnboarded,
    loading,
    refreshing,
    error,
    loadWallet: refreshWallet,
    refreshBalance,
    canUpgrade,
    isPriveMember: qualification?.qualifies || false,
  };
}
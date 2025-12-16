import PaystackModal from '@/components/PaystackModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWallet } from '@/hooks/useWallet';
import { paystackClient } from '@/lib/paystack';
import { supabase, verifyAndUpdateWalletTopUp } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// GLOBAL guard - persists across component remounts
const GLOBAL_PROCESSED_REFS = new Set<string>();
let PROCESSING_LOCK = false;

export default function WalletScreen() {
  const colorScheme = useColorScheme();
  const isDark = true;

  // Use real wallet data instead of hard-coded value
  const { wallet, loading, loadWallet } = useWallet();
  const walletBalance = wallet?.balance || 0;

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [pendingPaymentRef, setPendingPaymentRef] = useState<string | null>(null);

  // Guard to prevent processing the same payment reference multiple times
  const processedRefsRef = useRef<Set<string>>(new Set());

  // Listen for deep link redirects from Paystack
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      logger.info('Deep link received:', url);
      
      // Check if it's a wallet redirect from payment
      if (url.includes('wallet')) {
        logger.info('Payment redirect detected, refreshing wallet...');
        // Small delay to ensure webhook has processed
        setTimeout(() => {
          loadWallet();
        }, 2000);
      }
    };

    // Listen for URL events
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check if app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadWallet]);

  // Refresh wallet when screen comes into focus (after returning from payment)
  useFocusEffect(
    useCallback(() => {
      if (wallet) {
        logger.info('Wallet screen focused, refreshing balance...');
        loadWallet();
      }
    }, [wallet, loadWallet])
  );

  const paymentMethods = [
    {
      id: 'card',
      name: 'Debit/Credit Card',
      description: 'Instant transfer',
      icon: 'creditcard',
      fee: 'Free',
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: '2-3 business days',
      icon: 'building.columns',
      fee: 'Free',
    },
    {
      id: 'ussd',
      name: 'USSD Code',
      description: 'Dial *737#',
      icon: 'phone',
      fee: '₦50',
    },
  ];

  const handleTopUp = async () => {
    if (!wallet) {
      Alert.alert('Error', 'Wallet not found. Please complete Privé onboarding first.');
      return;
    }

    const amount = parseFloat(customAmount);
    
    if (!amount || isNaN(amount) || amount < 1000) {
      Alert.alert('Invalid Amount', 'Please enter an amount of at least ₦1,000');
      return;
    }
    
    logger.info('TOP-UP AMOUNT:', amount);

    if (!selectedPaymentMethod) {
      Alert.alert('Select Payment Method', 'Please choose how you want to pay');
      return;
    }

    setIsProcessing(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user profile for name and email
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const customerName = profile ? `${profile.first_name} ${profile.last_name}` : 'Quilox User';
      const customerEmail = user.email || '';

      // Generate unique transaction reference
      const txRef = `QLXTOP-${Date.now()}-${user.id.substring(0, 8)}`;

      // Create transaction record
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          type: 'credit',
          amount: amount,
          status: 'pending',
          reference: txRef,
          description: `Wallet top-up via ${selectedPaymentMethod}`,
          payment_method: selectedPaymentMethod,
        });

      if (txError) throw txError;

      const channels = selectedPaymentMethod === 'card'
        ? ['card']
        : selectedPaymentMethod === 'bank'
          ? ['bank_transfer']
          : ['ussd'];

      const paymentResponse = await paystackClient.initializeTransaction({
        reference: txRef,
        amount: amount,
        currency: 'NGN',
        email: customerEmail,
        callback_url: Platform.OS === 'web' ? `${window.location.origin}/payment-callback` : 'quiloxluxury://wallet',
        channels: channels as any,
        metadata: {
          purpose: 'wallet_topup',
          wallet_id: wallet.id,
          payment_method: selectedPaymentMethod,
          customer_name: customerName,
        },
      });

      if (!paymentResponse.success || !paymentResponse.paymentLink) {
        throw new Error(paymentResponse.error || 'Failed to generate payment link');
      }

      logger.info('Opening payment modal:', paymentResponse.paymentLink);

      // Open payment modal (keeps user in app)
      setPendingPaymentRef(txRef);
      setPaymentUrl(paymentResponse.paymentLink);
      setShowPaymentModal(true);

    } catch (error: any) {
      logger.error('Top-up failed:', error);
      Alert.alert(
        'Payment Failed',
        error.message || 'Unable to process payment. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    logger.info('=== PAYMENT SUCCESS CALLED ===', reference);
    
    // GLOBAL guard - check if already processed or currently processing
    if (GLOBAL_PROCESSED_REFS.has(reference)) {
      logger.info('=== GLOBAL: Already processed, skipping ===', reference);
      setShowPaymentModal(false);
      setPaymentUrl('');
      return;
    }
    
    // Check if another process is running
    if (PROCESSING_LOCK) {
      logger.info('=== GLOBAL: Processing lock active, skipping ===', reference);
      setShowPaymentModal(false);
      setPaymentUrl('');
      return;
    }
    
    // Acquire lock and mark as processed IMMEDIATELY (synchronous)
    PROCESSING_LOCK = true;
    GLOBAL_PROCESSED_REFS.add(reference);
    processedRefsRef.current.add(reference);
    
    logger.info('=== GLOBAL: Lock acquired, processing ===', reference);
    
    setShowPaymentModal(false);
    setPaymentUrl('');
    setIsProcessing(true);

    try {
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Verify payment and update wallet balance
      const result = await verifyAndUpdateWalletTopUp(reference, wallet.id);
      
      if (result.success) {
        Alert.alert(
          'Top-up Successful!',
          `₦${(result.newBalance || 0).toLocaleString()} is now your wallet balance.`
        );
        await loadWallet();
      } else {
        throw new Error(result.error || 'Failed to verify payment');
      }
    } catch (error: any) {
      logger.error('Error processing top-up:', error);
      Alert.alert('Error', error.message || 'Failed to process top-up. Please contact support.');
      await loadWallet();
    } finally {
      PROCESSING_LOCK = false; // Release lock
      setPendingPaymentRef(null);
      setIsProcessing(false);
      setSelectedAmount(null);
      setCustomAmount('');
      setSelectedPaymentMethod(null);
    }
  };

  const handlePaymentCancel = () => {
    logger.info('Payment cancelled');
    setShowPaymentModal(false);
    setPaymentUrl('');
    setPendingPaymentRef(null);
    Alert.alert('Payment Cancelled', 'You cancelled the payment. Please try again when ready.');
  };

  const handlePaymentError = (error: string) => {
    logger.error('Payment error from modal:', error);
    setShowPaymentModal(false);
    setPaymentUrl('');
    setPendingPaymentRef(null);
    Alert.alert('Payment Error', error || 'An error occurred during payment. Please try again.');
  };

  return (
    <View style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Privé Wallet</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: QuiloxColors.gold }]}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceLabel}>
              <IconSymbol name="wallet.pass" size={20} color={QuiloxColors.black} />
              <Text style={[styles.balanceLabelText, { color: QuiloxColors.black }]}>Available Balance</Text>
            </View>
            <TouchableOpacity>
              <IconSymbol name="eye" size={20} color={QuiloxColors.black} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.balanceAmount, { color: QuiloxColors.black }]}>₦{walletBalance.toLocaleString()}</Text>
          <Text style={[styles.balanceSubtext, { color: QuiloxColors.black, opacity: 0.7 }]}>
            Instantly available for bookings
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: QuiloxColors.gold }]}>
            <IconSymbol name="plus" size={20} color={QuiloxColors.black} />
            <Text style={[styles.actionButtonText, { color: QuiloxColors.black }]}>Top Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: QuiloxColors.darkGray }]}>
            <IconSymbol name="clock" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Enter Amount */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Enter Amount</Text>
          <TextInput
            style={[styles.customInput, { backgroundColor: QuiloxColors.darkGray, color: '#fff', fontSize: 18, paddingVertical: 16 }]}
            placeholder="Enter amount (min ₦1,000)"
            placeholderTextColor="#666"
            value={customAmount}
            onChangeText={setCustomAmount}
            keyboardType="numeric"
          />
          {customAmount ? (
            <Text style={{ color: QuiloxColors.gold, marginTop: 8, fontSize: 14 }}>
              You will top up: ₦{parseFloat(customAmount || '0').toLocaleString()}
            </Text>
          ) : null}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  { backgroundColor: QuiloxColors.darkGray },
                  selectedPaymentMethod === method.id && {
                    borderColor: QuiloxColors.gold,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedPaymentMethod(method.id)}
              >
                <View style={styles.paymentMethodContent}>
                  <View style={[styles.paymentIcon, { backgroundColor: QuiloxColors.gold + '20' }]}>
                    <IconSymbol name={method.icon as any} size={24} color={QuiloxColors.gold} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentName, { color: '#fff' }]}>{method.name}</Text>
                    <Text style={[styles.paymentDescription, { color: '#999' }]}>{method.description}</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.paymentFee,
                    { color: method.fee === 'Free' ? QuiloxColors.gold : '#fff' },
                  ]}
                >
                  {method.fee}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Top Up Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.topUpButton,
            {
              backgroundColor:
                customAmount && selectedPaymentMethod
                  ? QuiloxColors.gold
                  : QuiloxColors.darkGray,
            },
          ]}
          onPress={handleTopUp}
          disabled={!customAmount || !selectedPaymentMethod || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={QuiloxColors.black} />
          ) : (
            <Text
              style={[
                styles.topUpText,
                {
                  color:
                    customAmount && selectedPaymentMethod
                      ? QuiloxColors.black
                      : '#666',
                },
              ]}
            >
              Top Up Wallet
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Paystack Payment Modal */}
      <PaystackModal
        visible={showPaymentModal}
        paymentUrl={paymentUrl}
        reference={pendingPaymentRef || ''}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
        onError={handlePaymentError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20 },
  balanceCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    width: '30%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 12,
  },
  paymentFee: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: { padding: 20, paddingBottom: 40 },
  topUpButton: { padding: 18, borderRadius: 12, alignItems: 'center' },
  topUpText: { fontSize: 16, fontWeight: 'bold' },
});
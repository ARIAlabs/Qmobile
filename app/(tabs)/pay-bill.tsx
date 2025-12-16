import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PayBillScreen() {
  const colorScheme = useColorScheme();
  const isDark = true;

  const { wallet, loading, loadWallet } = useWallet();
  const walletBalance = wallet?.balance || 0;

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [billDescription, setBillDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const quickAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

  const handlePayBill = async () => {
    if (!wallet) {
      Alert.alert('Error', 'Wallet not found. Please complete Privé onboarding first.');
      return;
    }

    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount < 100) {
      Alert.alert('Invalid Amount', 'Please enter an amount of at least ₦100');
      return;
    }

    if (amount > walletBalance) {
      Alert.alert(
        'Insufficient Balance', 
        `Your wallet balance (₦${walletBalance.toLocaleString()}) is less than the bill amount (₦${amount.toLocaleString()}). Please top up your wallet first.`
      );
      return;
    }

    if (!billDescription.trim()) {
      Alert.alert('Bill Description Required', 'Please enter a description for this bill payment');
      return;
    }

    setIsProcessing(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique transaction reference
      const txRef = `QLXBILL-${Date.now()}-${user.id.substring(0, 8)}`;

      // Create transaction record (debit)
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          type: 'debit',
          amount: amount,
          status: 'completed',
          reference: txRef,
          description: billDescription,
          payment_method: 'wallet',
        });

      if (txError) throw txError;

      // Update wallet balance
      const newBalance = walletBalance - amount;
      const { error: balanceError } = await supabase
        .from('user_wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString() 
        })
        .eq('id', wallet.id);

      if (balanceError) throw balanceError;

      logger.info('Bill payment successful:', { txRef, amount, description: billDescription });

      Alert.alert(
        'Payment Successful',
        `₦${amount.toLocaleString()} has been deducted from your wallet.\n\nNew balance: ₦${newBalance.toLocaleString()}`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              loadWallet(); // Refresh wallet data
              router.back();
            }
          }
        ]
      );

    } catch (error: any) {
      logger.error('Bill payment failed:', error);
      Alert.alert(
        'Payment Failed',
        error.message || 'Unable to process payment. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Pay Bill</Text>
        <TouchableOpacity>
          <IconSymbol name="dollarsign.circle" size={24} color={QuiloxColors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: QuiloxColors.gold }]}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceLabel}>
              <IconSymbol name="wallet.pass" size={20} color={QuiloxColors.black} />
              <Text style={[styles.balanceLabelText, { color: QuiloxColors.black }]}>Available Balance</Text>
            </View>
          </View>
          <Text style={[styles.balanceAmount, { color: QuiloxColors.black }]}>₦{walletBalance.toLocaleString()}</Text>
          <Text style={[styles.balanceSubtext, { color: QuiloxColors.black, opacity: 0.7 }]}>
            Pay bills directly from your wallet
          </Text>
        </View>

        {/* Bill Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Bill Description</Text>
          <TextInput
            style={[styles.descriptionInput, { backgroundColor: QuiloxColors.darkGray, color: '#fff' }]}
            placeholder="e.g., Bottle service, Table reservation, etc."
            placeholderTextColor="#666"
            value={billDescription}
            onChangeText={setBillDescription}
          />
        </View>

        {/* Select Amount */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Select Amount</Text>
          <View style={styles.amountGrid}>
            {quickAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountButton,
                  { backgroundColor: QuiloxColors.darkGray },
                  selectedAmount === amount && {
                    backgroundColor: QuiloxColors.gold + '30',
                    borderColor: QuiloxColors.gold,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => {
                  setSelectedAmount(amount);
                  setCustomAmount('');
                }}
              >
                <Text
                  style={[
                    styles.amountText,
                    { color: selectedAmount === amount ? QuiloxColors.gold : '#fff' },
                  ]}
                >
                  ₦{amount >= 1000 ? `${amount / 1000}k` : amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Amount */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Or enter custom amount</Text>
          <TextInput
            style={[styles.customInput, { backgroundColor: QuiloxColors.darkGray, color: '#fff' }]}
            placeholder="Enter amount (min ₦100)"
            placeholderTextColor="#666"
            value={customAmount}
            onChangeText={(text) => {
              setCustomAmount(text);
              setSelectedAmount(null);
            }}
            keyboardType="numeric"
          />
        </View>

        {/* Payment Summary */}
        {(selectedAmount || customAmount) && billDescription && (
          <View style={[styles.summaryCard, { backgroundColor: QuiloxColors.darkGray }]}>
            <Text style={[styles.summaryTitle, { color: QuiloxColors.gold }]}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#999' }]}>Description:</Text>
              <Text style={[styles.summaryValue, { color: '#fff' }]}>{billDescription}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#999' }]}>Amount:</Text>
              <Text style={[styles.summaryValue, { color: '#fff' }]}>
                ₦{(selectedAmount || parseFloat(customAmount) || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#999' }]}>New Balance:</Text>
              <Text style={[styles.summaryTotal, { color: QuiloxColors.gold }]}>
                ₦{(walletBalance - (selectedAmount || parseFloat(customAmount) || 0)).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            {
              backgroundColor:
                (selectedAmount || customAmount) && billDescription
                  ? QuiloxColors.gold
                  : QuiloxColors.darkGray,
            },
          ]}
          onPress={handlePayBill}
          disabled={!(selectedAmount || customAmount) || !billDescription || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={QuiloxColors.black} />
          ) : (
            <Text
              style={[
                styles.payText,
                {
                  color:
                    (selectedAmount || customAmount) && billDescription
                      ? QuiloxColors.black
                      : '#666',
                },
              ]}
            >
              Pay Bill
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  descriptionInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
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
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  footer: { padding: 20, paddingBottom: 40 },
  payButton: { padding: 18, borderRadius: 12, alignItems: 'center' },
  payText: { fontSize: 16, fontWeight: 'bold' },
});
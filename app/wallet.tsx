import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { QuiloxColors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';

export default function WalletScreen() {
  const colorScheme = useColorScheme();
  const isDark = true;

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const walletBalance = 75000;

  const quickAmounts = [5000, 10000, 25000, 50000, 100000, 200000];

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

  const handleTopUp = () => {
    // Handle top-up logic
    console.log('Top up:', selectedAmount || customAmount);
  };

  return (
    <View style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Privé Wallet</Text>
        <TouchableOpacity>
          <IconSymbol name="wallet.pass" size={24} color={QuiloxColors.gold} />
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
                  ₦{amount / 1000}k
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
            placeholder="Enter amount (min ₦1,000)"
            placeholderTextColor="#666"
            value={customAmount}
            onChangeText={(text) => {
              setCustomAmount(text);
              setSelectedAmount(null);
            }}
            keyboardType="numeric"
          />
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
                (selectedAmount || customAmount) && selectedPaymentMethod
                  ? QuiloxColors.gold
                  : QuiloxColors.darkGray,
            },
          ]}
          onPress={handleTopUp}
          disabled={!(selectedAmount || customAmount) || !selectedPaymentMethod}
        >
          <Text
            style={[
              styles.topUpText,
              {
                color:
                  (selectedAmount || customAmount) && selectedPaymentMethod
                    ? QuiloxColors.black
                    : '#666',
              },
            ]}
          >
            Top Up Wallet
          </Text>
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
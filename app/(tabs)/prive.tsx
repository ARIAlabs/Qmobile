import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWallet } from '@/hooks/useWallet';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PriveScreen() {
  const colorScheme = useColorScheme();
  const isDark = true; // Force dark mode

  // Use wallet hook for real data
  const { wallet, qualification, loading, refreshing, refreshBalance, isPriveMember } = useWallet();

  const walletBalance = wallet?.balance || 0;
  const loyaltyPoints = Math.floor(walletBalance * 0.7); // 0.7 points per naira spent
  const membershipTier = walletBalance >= 100000 ? 'Gold' : walletBalance >= 50000 ? 'Silver' : 'Bronze';
  const bookingCount = qualification?.bookingCount || 0;

  const benefits = [
    { title: '15% booking discount', description: 'Save on every reservation', icon: 'percent' },
    { title: 'Exclusive events', description: 'Access to members-only nights', icon: 'star' },
    { title: 'Loyalty rewards', description: 'Earn points on every spend', icon: 'gift' },
    { title: 'VIP table access', description: 'Best tables in the house', icon: 'checkmark.seal' },
  ];

  const priveServices = [
    { title: 'Rewards', description: 'Redeem exclusive perks', icon: 'gift' },
    { title: 'Premium Menu', description: 'Reserved selections', icon: 'list.bullet' },
  ];

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: QuiloxColors.black }]}>
        <ActivityIndicator size="large" color={QuiloxColors.gold} />
        <Text style={[styles.loadingText, { color: '#fff' }]}>Loading your Privé account...</Text>
      </View>
    );
  }

  // Show qualification message if not qualified
  if (!isPriveMember) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
        <View style={styles.qualificationCard}>
          <IconSymbol name="crown.fill" size={64} color={QuiloxColors.gold} style={styles.crownIcon} />
          <Text style={[styles.qualificationTitle, { color: '#fff' }]}>Join Quilox Privé</Text>
          <Text style={[styles.qualificationSubtitle, { color: '#999' }]}>
            You're {qualification?.nextMilestone || 5} bookings away from unlocking exclusive benefits
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: QuiloxColors.gold,
                    width: `${(bookingCount / (qualification?.requiredBookings || 5)) * 100}%`
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: '#fff' }]}>
              {bookingCount} / {qualification?.requiredBookings || 5} bookings
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.bookNowButton, { backgroundColor: QuiloxColors.gold }]}
            onPress={() => router.push('/')}
          >
            <Text style={[styles.bookNowText, { color: QuiloxColors.black }]}>Make a Booking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: QuiloxColors.black }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshBalance}
          tintColor={QuiloxColors.gold}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Image
            source={require('@/assets/images/quilox-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.memberBadge}>
            <IconSymbol name="crown.fill" size={14} color={QuiloxColors.gold} />
            <Text style={[styles.memberText, { color: QuiloxColors.gold }]}>Privé Member</Text>
          </View>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: QuiloxColors.secondary + '30' }]}>
          <IconSymbol name="shield.fill" size={16} color={QuiloxColors.secondary} />
          <Text style={[styles.tierText, { color: QuiloxColors.secondary }]}>{membershipTier}</Text>
          <Text style={[styles.bookingBadge, { color: '#999' }]}>{bookingCount} bookings</Text>
        </View>
      </View>

      {/* Wallet & Points Cards */}
      <View style={styles.cardsContainer}>
        {/* Wallet Card */}
        <TouchableOpacity 
          style={[styles.card, styles.walletCard, { backgroundColor: QuiloxColors.gold }]}
          onPress={() => router.push('/wallet')}
        >
          <View style={styles.cardHeader}>
            <IconSymbol name="wallet.pass" size={24} color={QuiloxColors.black} />
            <Text style={[styles.cardLabel, { color: QuiloxColors.black }]}>WALLET</Text>
          </View>
          <Text style={[styles.cardAmount, { color: QuiloxColors.black }]}>₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={[styles.cardSubtext, { color: QuiloxColors.black, opacity: 0.7 }]}>Available Balance</Text>
          {wallet && (
            <Text style={[styles.accountNumber, { color: QuiloxColors.black, opacity: 0.6 }]}>
              {wallet.account_number}
            </Text>
          )}
        </TouchableOpacity>

        {/* Points Card */}
        <View style={[styles.card, styles.pointsCard, { backgroundColor: '#1a1a3e', borderColor: QuiloxColors.gold, borderWidth: 1 }]}>
          <View style={styles.cardHeader}>
            <IconSymbol name="star.fill" size={24} color={QuiloxColors.gold} />
            <Text style={[styles.cardLabel, { color: QuiloxColors.gold }]}>POINTS</Text>
          </View>
          <Text style={[styles.cardAmount, { color: '#fff' }]}>{loyaltyPoints.toLocaleString()}</Text>
          <Text style={[styles.cardSubtext, { color: '#fff', opacity: 0.7 }]}>Loyalty Points</Text>
        </View>
      </View>

      {/* Scan to Pay */}
      <TouchableOpacity style={[styles.scanCard, { backgroundColor: QuiloxColors.darkGray, borderColor: QuiloxColors.gold, borderWidth: 1 }]}>
        <View style={styles.scanContent}>
          <View style={[styles.scanIcon, { backgroundColor: QuiloxColors.gold + '20' }]}>
            <IconSymbol name="qrcode" size={32} color={QuiloxColors.gold} />
          </View>
          <View style={styles.scanText}>
            <Text style={[styles.scanTitle, { color: '#fff' }]}>Scan to Pay</Text>
            <Text style={[styles.scanSubtitle, { color: '#999' }]}>Instant QR payments</Text>
          </View>
        </View>
        <View style={[styles.fastPayBadge, { backgroundColor: QuiloxColors.success }]}>
          <Text style={styles.fastPayText}>Fast Pay</Text>
        </View>
      </TouchableOpacity>

      {/* Privé Services */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#fff' }]}>Privé Services</Text>
        <View style={styles.servicesGrid}>
          {priveServices.map((service, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.serviceCard, { backgroundColor: QuiloxColors.darkGray }]}
            >
              <View style={[styles.serviceIcon, { backgroundColor: QuiloxColors.gold + '20' }]}>
                <IconSymbol name={service.icon as any} size={24} color={QuiloxColors.gold} />
              </View>
              <Text style={[styles.serviceTitle, { color: '#fff' }]}>{service.title}</Text>
              <Text style={[styles.serviceDescription, { color: '#999' }]}>{service.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Your Silver Benefits */}
      <View style={styles.section}>
        <View style={styles.benefitsHeader}>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Your Silver Benefits</Text>
          <IconSymbol name="trophy.fill" size={24} color={QuiloxColors.gold} />
        </View>
        <View style={styles.benefitsList}>
          {benefits.map((benefit, index) => (
            <View key={index} style={[styles.benefitItem, { backgroundColor: QuiloxColors.darkGray }]}>
              <View style={[styles.benefitIcon, { backgroundColor: QuiloxColors.gold + '20' }]}>
                <IconSymbol name={benefit.icon as any} size={20} color={QuiloxColors.gold} />
              </View>
              <View style={styles.benefitText}>
                <Text style={[styles.benefitTitle, { color: '#fff' }]}>{benefit.title}</Text>
                <Text style={[styles.benefitDescription, { color: '#999' }]}>{benefit.description}</Text>
              </View>
              <IconSymbol name="checkmark.circle.fill" size={20} color={QuiloxColors.success} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: QuiloxColors.red,
    marginBottom: 4,
  },
  logoImage: {
    width: 150,
    height: 50,
    marginBottom: 4,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  memberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bookingBadge: {
    fontSize: 12,
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
  },
  walletCard: {},
  pointsCard: {},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
  },
  scanCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  scanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  scanIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  scanSubtitle: {
    fontSize: 14,
  },
  fastPayBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fastPayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
  },
  benefitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 12,
  },
});

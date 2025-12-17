import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWallet } from '@/hooks/useWallet';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PriveScreen() {
  const colorScheme = useColorScheme();
  const isDark = true; // Force dark mode

  // Use wallet hook for real data
  const { wallet, qualification, priveOnboarded, loading, refreshing, refreshBalance, loadWallet, isPriveMember } = useWallet();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 [Privé Screen] useFocusEffect triggered, calling loadWallet');
      loadWallet();
    }, [loadWallet])
  );

  const walletBalance = wallet?.balance || 0;
  const loyaltyPoints = wallet?.loyalty_points || 0; // Points only added on top-up, not deducted on spend
  const membershipTier = walletBalance >= 100000 ? 'Gold' : walletBalance >= 50000 ? 'Silver' : 'Bronze';
  const bookingCount = qualification?.bookingCount || 0;

  const benefits = [
    { title: '15% booking discount', description: 'Save on every reservation', icon: 'percent' },
    { title: 'Exclusive events', description: 'Access to members-only nights', icon: 'star' },
    { title: 'Loyalty rewards', description: 'Earn points on every top-up', icon: 'gift' },
    { title: 'VIP table access', description: 'Best tables in the house', icon: 'checkmark.seal' },
  ];

  const priveServices = [
    { title: 'Rewards', description: 'Redeem exclusive perks', icon: 'gift', comingSoon: true },
    { title: 'Emergency', description: 'EMT services', icon: 'cross.case.fill', route: '/emergency' },
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

  // Show prompt to complete profile if qualified but BVN not set
  if (isPriveMember && !priveOnboarded) {
    return (
      <View style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
        <ScrollView
          contentContainerStyle={styles.lockedContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.lockedHeroSection}>
            <Image
              source={require('@/assets/images/quilox-logo.png')}
              style={styles.lockedLogoImage}
              resizeMode="contain"
            />
            <View style={styles.lockIconContainer}>
              <View style={[styles.lockIconOuter, { borderColor: QuiloxColors.gold }]}>
                <View style={[styles.lockIconInner, { backgroundColor: QuiloxColors.gold + '20' }]}>
                  <IconSymbol name="crown.fill" size={48} color={QuiloxColors.gold} />
                </View>
              </View>
            </View>
            <Text style={styles.lockedTitle}>Congratulations! 🎉</Text>
            <Text style={styles.lockedSubtitle}>
              You've qualified for Quilox Privé! Add your BVN in your profile to unlock your wallet and exclusive benefits.
            </Text>
          </View>

          {/* Progress Card */}
          <View style={[styles.lockedProgressCard, { backgroundColor: QuiloxColors.darkGray }]}>
            <View style={styles.lockedProgressHeader}>
              <View>
                <Text style={styles.lockedProgressTitle}>Your Progress</Text>
                <Text style={[styles.lockedProgressSubtitle, { color: '#999' }]}>
                  {bookingCount} booking{bookingCount !== 1 ? 's' : ''} completed
                </Text>
              </View>
              <View style={[styles.progressBadge, { backgroundColor: QuiloxColors.gold }]}>
                <IconSymbol name="checkmark.circle.fill" size={20} color={QuiloxColors.black} />
                <Text style={[styles.progressBadgeText, { color: QuiloxColors.black }]}>Qualified!</Text>
              </View>
            </View>
          </View>

          {/* CTA Card */}
          <View style={[styles.ctaCard, { backgroundColor: QuiloxColors.gold + '15' }]}>
            <IconSymbol name="sparkles" size={32} color={QuiloxColors.gold} />
            <Text style={[styles.ctaTitle, { color: QuiloxColors.gold }]}>Complete Your Profile</Text>
            <Text style={[styles.ctaDescription, { color: '#ccc' }]}>
              Add your BVN to create your virtual wallet account
            </Text>
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: QuiloxColors.gold }]}
              onPress={() => router.push('/edit-profile')}
            >
              <Text style={[styles.ctaButtonText, { color: QuiloxColors.black }]}>Edit Profile</Text>
              <IconSymbol name="arrow.right" size={20} color={QuiloxColors.black} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Show upgrade CTA if not a Privé member
  if (!isPriveMember) {
    const upgradeBenefits = [
      { icon: 'wallet.pass', title: 'Privé Wallet', description: 'Seamless payments and balance management' },
      { icon: 'gift', title: 'Loyalty Rewards', description: 'Earn points on every top-up' },
      { icon: 'crown.fill', title: 'VIP Access', description: 'Priority access to premium tables' },
      { icon: 'star.fill', title: 'Exclusive Events', description: 'Members-only nights and experiences' },
    ];

    return (
      <ScrollView 
        style={[styles.container, { backgroundColor: QuiloxColors.black }]}
        contentContainerStyle={styles.lockedContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.lockedHeroSection}>
          <Image
            source={require('@/assets/images/quilox-logo.png')}
            style={styles.lockedLogoImage}
            resizeMode="contain"
          />
          <View style={styles.lockIconContainer}>
            <View style={[styles.lockIconOuter, { borderColor: QuiloxColors.gold }]}>
              <View style={[styles.lockIconInner, { backgroundColor: QuiloxColors.gold + '20' }]}>
                <IconSymbol name="crown.fill" size={48} color={QuiloxColors.gold} />
              </View>
            </View>
          </View>
          <Text style={styles.lockedTitle}>Quilox Privé</Text>
          <Text style={styles.lockedSubtitle}>Exclusive Luxury Access</Text>
        </View>

        {/* Benefits Preview */}
        <View style={styles.lockedBenefitsSection}>
          <Text style={styles.lockedSectionTitle}>Member Benefits</Text>
          <View style={styles.lockedBenefitsGrid}>
            {upgradeBenefits.map((benefit, index) => (
              <View 
                key={index} 
                style={[styles.lockedBenefitCard, { backgroundColor: QuiloxColors.darkGray }]}
              >
                <View style={[styles.lockedBenefitIcon, { backgroundColor: QuiloxColors.gold + '20' }]}>
                  <IconSymbol name={benefit.icon as any} size={24} color={QuiloxColors.gold} />
                </View>
                <Text style={styles.lockedBenefitTitle}>{benefit.title}</Text>
                <Text style={styles.lockedBenefitDescription}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upgrade CTA */}
        <View style={styles.ctaSection}>
          <View style={[styles.ctaCard, { backgroundColor: QuiloxColors.gold + '15' }]}>
            <IconSymbol name="sparkles" size={32} color={QuiloxColors.gold} />
            <Text style={[styles.ctaTitle, { color: QuiloxColors.gold }]}>Upgrade to Privé</Text>
            <Text style={[styles.ctaDescription, { color: '#ccc' }]}>
              Complete a quick onboarding to create your wallet and unlock exclusive benefits
            </Text>
            <TouchableOpacity 
              style={[styles.ctaButton, { backgroundColor: QuiloxColors.gold }]}
              onPress={() => router.push('/prive-onboarding')}
            >
              <Text style={[styles.ctaButtonText, { color: QuiloxColors.black }]}>Get Started</Text>
              <IconSymbol name="arrow.right" size={20} color={QuiloxColors.black} />
            </TouchableOpacity>
          </View>
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
          onRefresh={loadWallet}
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
          style={[styles.horizontalCard, { backgroundColor: QuiloxColors.gold }]}
          onPress={() => router.push('/wallet')}
        >
          <View style={styles.horizontalCardContent}>
            <View style={[styles.horizontalCardIcon, { backgroundColor: QuiloxColors.black + '15' }]}>
              <IconSymbol name="wallet.pass" size={32} color={QuiloxColors.black} />
            </View>
            <View style={styles.horizontalCardText}>
              <Text style={[styles.horizontalCardLabel, { color: QuiloxColors.black, opacity: 0.8 }]}>WALLET</Text>
              <Text style={[styles.horizontalCardAmount, { color: QuiloxColors.black }]}>₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              {wallet && (
                <Text style={[styles.horizontalCardSubtext, { color: QuiloxColors.black, opacity: 0.7 }]}>
                  {wallet.account_number}
                </Text>
              )}
            </View>
          </View>
          <IconSymbol name="chevron.right" size={20} color={QuiloxColors.black} />
        </TouchableOpacity>

        {/* Points Card */}
        <TouchableOpacity 
          style={[styles.horizontalCard, { backgroundColor: '#1a1a3e', borderColor: QuiloxColors.gold, borderWidth: 1 }]}
        >
          <View style={styles.horizontalCardContent}>
            <View style={[styles.horizontalCardIcon, { backgroundColor: QuiloxColors.gold + '20' }]}>
              <IconSymbol name="star.fill" size={32} color={QuiloxColors.gold} />
            </View>
            <View style={styles.horizontalCardText}>
              <Text style={[styles.horizontalCardLabel, { color: QuiloxColors.gold, opacity: 0.8 }]}>LOYALTY POINTS</Text>
              <Text style={[styles.horizontalCardAmount, { color: '#fff' }]}>{loyaltyPoints.toLocaleString()}</Text>
              <Text style={[styles.horizontalCardSubtext, { color: '#fff', opacity: 0.7 }]}>1 point per ₦100 top-up</Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={20} color={QuiloxColors.gold} />
        </TouchableOpacity>
      </View>

      {/* Pay Bill */}
      <TouchableOpacity 
        style={[styles.scanCard, { backgroundColor: QuiloxColors.darkGray, borderColor: QuiloxColors.gold, borderWidth: 1 }]}
        onPress={() => router.push('/pay-bill')}
      >
        <View style={styles.scanContent}>
          <View style={[styles.scanIcon, { backgroundColor: QuiloxColors.gold + '20' }]}>
            <IconSymbol name="dollarsign.circle" size={32} color={QuiloxColors.gold} />
          </View>
          <View style={styles.scanText}>
            <Text style={[styles.scanTitle, { color: '#fff' }]}>Pay Bill</Text>
            <Text style={[styles.scanSubtitle, { color: '#999' }]}>Enter amount to pay from wallet</Text>
          </View>
        </View>
        <View style={[styles.fastPayBadge, { backgroundColor: QuiloxColors.gold }]}>
          <Text style={styles.fastPayText}>Pay</Text>
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
              onPress={() => service.route && !service.comingSoon && router.push(service.route as any)}
              disabled={service.comingSoon}
              activeOpacity={service.comingSoon ? 1 : 0.7}
            >
              {service.comingSoon && (
                <View style={[styles.comingSoonBadge, { backgroundColor: QuiloxColors.gold }]}>
                  <Text style={{ color: QuiloxColors.black, fontSize: 10, fontWeight: '600' }}>COMING SOON</Text>
                </View>
              )}
              <View style={[styles.serviceIcon, { backgroundColor: QuiloxColors.gold + '20', opacity: service.comingSoon ? 0.5 : 1 }]}>
                <IconSymbol name={service.icon as any} size={24} color={QuiloxColors.gold} />
              </View>
              <Text style={[styles.serviceTitle, { color: '#fff', opacity: service.comingSoon ? 0.5 : 1 }]}>{service.title}</Text>
              <Text style={[styles.serviceDescription, { color: '#999', opacity: service.comingSoon ? 0.5 : 1 }]}>{service.description}</Text>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  accountNumber: {
    fontSize: 11,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  // Locked Screen Styles
  lockedContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  lockedHeroSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  lockedLogoImage: {
    width: 95,  // Reduced by 50%
    height: 55,  // Reduced by 50%
    marginBottom: 24,
  },
  logoImage: {
    width: 75,  // Reduced by 50% from default
    height: 45,  // Reduced by 50% from default
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  lockIconContainer: {
    marginBottom: 24,
  },
  lockIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  lockedSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  lockedProgressCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  lockedProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  lockedProgressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  lockedProgressSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  percentageBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockedProgressBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  lockedProgressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  bookingCounter: {
    alignItems: 'center',
  },
  bookingCountText: {
    fontSize: 20,
    marginBottom: 4,
  },
  bookingLabel: {
    fontSize: 14,
    color: '#999',
  },
  milestonesSection: {
    marginBottom: 32,
  },
  lockedSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  milestonesContainer: {
    paddingLeft: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  milestoneLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  milestoneCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  milestoneLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  milestoneContent: {
    flex: 1,
    paddingVertical: 6,
  },
  milestoneLabel: {
    fontSize: 16,
  },
  lockedBenefitsSection: {
    marginBottom: 32,
  },
  lockedBenefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  crownBadge: {
    marginLeft: 8,
  },
  lockedBenefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  lockedBenefitCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
  },
  lockedBenefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedBenefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  lockedBenefitDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  ctaSection: {
    marginTop: 8,
  },
  ctaCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  horizontalCard: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  horizontalCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalCardText: {
    flex: 1,
  },
  horizontalCardLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  horizontalCardAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  horizontalCardSubtext: {
    fontSize: 11,
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
    position: 'relative',
    overflow: 'hidden',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: -20,
    paddingHorizontal: 20,
    paddingVertical: 4,
    transform: [{ rotate: '30deg' }],
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

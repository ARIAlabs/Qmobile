import Carousel from '@/app/components/Carousel';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWallet } from '@/hooks/useWallet';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = true; // Force dark mode
  
  // Use real wallet data
  const { qualification, loadWallet, isPriveMember } = useWallet();
  const bookingCount = qualification?.bookingCount || 0;
  const maxBookings = qualification?.requiredBookings || 5;
  const progress = Math.min(bookingCount / maxBookings, 1);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🏠 [Home Screen] useFocusEffect triggered, calling loadWallet');
      loadWallet();
    }, [loadWallet])
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image 
          source={require('@/assets/images/quilox-logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <TouchableOpacity>
          <IconSymbol name="bell" size={24} color={QuiloxColors.gold} />
        </TouchableOpacity>
      </View>

      {/* VIP Experience Banner */}
      <View>
        <Carousel />
      </View>
      

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: QuiloxColors.darkGray }]}
          onPress={() => router.push('/booking')}
        >
          <View style={[styles.iconContainer, { backgroundColor: QuiloxColors.gold }]}>
            <IconSymbol name="calendar" size={24} color={QuiloxColors.black} />
          </View>
          <Text style={[styles.actionText, { color: '#fff' }]}>Book Table</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: QuiloxColors.darkGray }]}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <View style={[styles.iconContainer, { backgroundColor: QuiloxColors.gold }]}>
            <IconSymbol name="photo" size={24} color={QuiloxColors.black} />
          </View>
          <Text style={[styles.actionText, { color: '#fff' }]}>Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: QuiloxColors.darkGray }]}
          onPress={() => router.push('/(tabs)/shop')}
        >
          <View style={[styles.iconContainer, { backgroundColor: QuiloxColors.gold }]}>
            <IconSymbol name="bag" size={24} color={QuiloxColors.black} />
          </View>
          <Text style={[styles.actionText, { color: '#fff' }]}>Shop</Text>
        </TouchableOpacity>
      </View>

      {/* Quilox Privé */}
      <TouchableOpacity 
        style={[styles.priveCard, { backgroundColor: QuiloxColors.darkGray }]}
        onPress={() => router.push(isPriveMember ? '/(tabs)/prive' : '/prive-onboarding')}
        activeOpacity={0.8}
      >
        <View style={styles.priveHeader}>
          <Text style={[styles.priveTitle, { color: '#fff' }]}>Quilox Privé</Text>
          <IconSymbol name="crown.fill" size={20} color={QuiloxColors.gold} />
        </View>

        {isPriveMember ? (
          <View style={styles.unlockedContainer}>
            <IconSymbol name="checkmark.circle.fill" size={20} color={QuiloxColors.success} />
            <Text style={[styles.unlockedText, { color: QuiloxColors.success }]}>
              Welcome to Privé! Tap to view your wallet.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={[styles.priveDescription, { color: '#999' }]}>
              Upgrade to access exclusive benefits, priority bookings, and your Privé wallet.
            </Text>
            <View style={[styles.upgradeButton, { backgroundColor: QuiloxColors.gold }]}>
              <Text style={{ color: QuiloxColors.black, fontWeight: '600' }}>Upgrade to Privé</Text>
              <IconSymbol name="arrow.right" size={16} color={QuiloxColors.black} />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* My Bookings */}
      <View style={styles.bookingsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>My Bookings</Text>
          <TouchableOpacity>
            <Text style={{ color: QuiloxColors.gold }}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.bookingCard, { backgroundColor: QuiloxColors.darkGray }]}>
          <View style={styles.bookingHeader}>
            <View style={styles.bookingInfo}>
              <IconSymbol name="clock" size={16} color="#999" />
              <Text style={[styles.bookingTable, { color: '#fff' }]}>Table #12 - VIP Section</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: QuiloxColors.success + '20' }]}>
              <Text style={[styles.statusText, { color: QuiloxColors.success }]}>Confirmed</Text>
            </View>
          </View>
          <Text style={[styles.bookingTime, { color: '#999' }]}>Tonight, 9:00 PM • 6 guests</Text>
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
    padding: 10,
    paddingTop: 60,
  },
  logoContainer: {
    height: 50,
    justifyContent: 'left',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: QuiloxColors.red,
  },
  logoImage: {
    width: 170,
    height: 50,
  },
  vipBanner: {
    height: 200,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  vipOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
  },
  vipTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  vipSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
  },
  vipDescription: {
    fontSize: 14,
    color: QuiloxColors.gold,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priveCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  priveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  priveCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  priveDescription: {
    fontSize: 14,
  },
  unlockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unlockedText: {
    fontSize: 14,
    flex: 1,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  bookingsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookingCard: {
    padding: 16,
    borderRadius: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bookingTable: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingTime: {
    fontSize: 14,
  },
});

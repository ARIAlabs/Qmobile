import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BookingWithTable, cancelBooking, fetchUserBookings, supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BookingHistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = true;
  const [bookings, setBookings] = useState<BookingWithTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndBookings();
  }, []);

  const loadUserAndBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      await loadBookings();
    } catch (error) {
      console.error('Error loading user:', error);
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const data = await fetchUserBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to cancel this booking?')) {
        await performCancel(bookingId);
      }
    } else {
      Alert.alert(
        'Cancel Booking',
        'Are you sure you want to cancel this booking?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: () => performCancel(bookingId),
          },
        ]
      );
    }
  };

  const performCancel = async (bookingId: string) => {
    const result = await cancelBooking(bookingId);
    if (result.success) {
      Alert.alert('Success', 'Booking cancelled successfully');
      loadBookings();
    } else {
      Alert.alert('Error', result.error || 'Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return QuiloxColors.gold;
      case 'cancelled': return '#EF4444';
      case 'completed': return '#6B7280';
      default: return '#999';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: QuiloxColors.black, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={QuiloxColors.gold} />
        <Text style={{ color: QuiloxColors.gold, marginTop: 10 }}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>My Bookings</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={QuiloxColors.gold} />
        }
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="calendar" size={64} color="#333" />
            <Text style={[styles.emptyTitle, { color: '#666' }]}>No Bookings Yet</Text>
            <Text style={[styles.emptyText, { color: '#999' }]}>
              Your table reservations will appear here
            </Text>
            <TouchableOpacity
              style={[styles.bookNowButton, { backgroundColor: QuiloxColors.gold }]}
              onPress={() => router.push('/booking')}
            >
              <Text style={[styles.bookNowText, { color: QuiloxColors.black }]}>Book a Table</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {bookings.map((booking) => (
              <View key={booking.id} style={[styles.bookingCard, { backgroundColor: QuiloxColors.darkGray }]}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {getStatusText(booking.status)}
                  </Text>
                </View>

                <View style={styles.bookingHeader}>
                  <Text style={[styles.tableName, { color: '#fff' }]}>{booking.table.name}</Text>
                  <Text style={[styles.tableNumber, { color: QuiloxColors.gold }]}>{booking.table.table_number}</Text>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="calendar" size={16} color="#999" />
                    <Text style={[styles.detailText, { color: '#fff' }]}>
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol name="person.2" size={16} color="#999" />
                    <Text style={[styles.detailText, { color: '#fff' }]}>{booking.guest_count} Guests</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol name="person" size={16} color="#999" />
                    <Text style={[styles.detailText, { color: '#fff' }]}>{booking.guest_name}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol name="creditcard" size={16} color="#999" />
                    <Text style={[styles.detailText, { color: QuiloxColors.gold }]}>
                      ₦{booking.booking_fee.toLocaleString()}
                    </Text>
                  </View>

                  {booking.special_requests && (
                    <View style={styles.specialRequests}>
                      <Text style={[styles.specialRequestsLabel, { color: '#999' }]}>Special Requests:</Text>
                      <Text style={[styles.specialRequestsText, { color: '#fff' }]}>{booking.special_requests}</Text>
                    </View>
                  )}
                </View>

                {booking.status === 'pending' || booking.status === 'confirmed' ? (
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: '#EF4444' }]}
                    onPress={() => handleCancelBooking(booking.id)}
                  >
                    <Text style={[styles.cancelButtonText, { color: '#EF4444' }]}>Cancel Booking</Text>
                  </TouchableOpacity>
                ) : null}

                <Text style={[styles.createdAt, { color: '#666' }]}>
                  Booked on {new Date(booking.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  bookNowButton: { marginTop: 20, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  bookNowText: { fontSize: 16, fontWeight: 'bold' },
  bookingsList: { gap: 16, paddingBottom: 20 },
  bookingCard: { borderRadius: 16, padding: 16, gap: 12 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  bookingHeader: { gap: 4 },
  tableName: { fontSize: 20, fontWeight: 'bold' },
  tableNumber: { fontSize: 14, fontWeight: '600' },
  bookingDetails: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14 },
  specialRequests: { marginTop: 8, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, gap: 4 },
  specialRequestsLabel: { fontSize: 12, fontWeight: '600' },
  specialRequestsText: { fontSize: 14 },
  cancelButton: { borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { fontSize: 14, fontWeight: '600' },
  createdAt: { fontSize: 12, marginTop: 8 },
});
import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useBooking } from '@/context/BookingContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { complianceManager, DataCategory, LegalBasis } from '@/lib/compliance';
import { createBooking, supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BookingConfirmationScreen() {
  const colorScheme = useColorScheme();
  const isDark = true;
  const { selectedDate, guestCount, selectedTable, guestInfo, setGuestInfo, resetBooking } = useBooking();
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTable || !guestInfo.name || !guestInfo.email || !guestInfo.phone) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    
    // Request NDPR consent for booking
    try {
      const consent = await complianceManager.requestConsent(
        userId || 'guest',
        'Table Booking',
        [DataCategory.PERSONAL_INFO, DataCategory.FINANCIAL],
        LegalBasis.CONTRACT
      );
      await complianceManager.grantConsent(consent.id, userId || 'guest');
    } catch (error) {
      console.error('Consent error:', error);
    }
    
    try {
      const bookingData = {
        user_id: userId, // Use authenticated user ID
        table_id: selectedTable.id,
        booking_date: selectedDate.toISOString().split('T')[0],
        guest_count: guestCount,
        guest_name: guestInfo.name,
        guest_email: guestInfo.email,
        guest_phone: guestInfo.phone,
        special_requests: guestInfo.specialRequests || null,
        status: 'pending' as const,
        booking_fee: selectedTable.booking_fee,
      };

      const result = await createBooking(bookingData);

      if (result.success) {
        if (Platform.OS === 'web') {
          alert(`Booking Confirmed!\n\nYour table has been reserved for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}. We'll send a confirmation email to ${guestInfo.email}.`);
          resetBooking();
          router.push('/(tabs)');
        } else {
          Alert.alert(
            'Booking Confirmed!',
            `Your table has been reserved for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}. We'll send a confirmation email to ${guestInfo.email}.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  resetBooking();
                  router.push('/(tabs)');
                },
              },
            ]
          );
        }
      } else {
        Alert.alert('Booking Failed', result.error || 'Unable to complete your booking. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color={QuiloxColors.gold} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Guest Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <View style={[styles.summaryCard, { backgroundColor: QuiloxColors.darkGray }]}>
          <Text style={[styles.summaryTitle, { color: QuiloxColors.gold }]}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <IconSymbol name="calendar" size={20} color="#999" />
            <Text style={[styles.summaryText, { color: '#fff' }]}>
              {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) || 'No date selected'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <IconSymbol name="person.2" size={20} color="#999" />
            <Text style={[styles.summaryText, { color: '#fff' }]}>{guestCount} Guests</Text>
          </View>
          <View style={styles.summaryRow}>
            <IconSymbol name="location" size={20} color="#999" />
            <Text style={[styles.summaryText, { color: '#fff' }]}>
              {selectedTable ? `${selectedTable.name} - ${selectedTable.table_number}` : 'No table selected'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <IconSymbol name="creditcard" size={20} color="#999" />
            <Text style={[styles.summaryText, { color: QuiloxColors.gold }]}>
              ₦{selectedTable?.booking_fee.toLocaleString() || '0'} booking fee
            </Text>
          </View>
        </View>

        {/* Guest Information Form */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Your Information</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: '#999' }]}>Full Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: QuiloxColors.darkGray, color: '#fff' }]}
              placeholder="Enter your full name"
              placeholderTextColor="#666"
              value={guestInfo.name}
              onChangeText={(text) => setGuestInfo({ name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: '#999' }]}>Email Address *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: QuiloxColors.darkGray, color: '#fff' }]}
              placeholder="your.email@example.com"
              placeholderTextColor="#666"
              value={guestInfo.email}
              onChangeText={(text) => setGuestInfo({ email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: '#999' }]}>Phone Number *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: QuiloxColors.darkGray, color: '#fff' }]}
              placeholder="+234 XXX XXX XXXX"
              placeholderTextColor="#666"
              value={guestInfo.phone}
              onChangeText={(text) => setGuestInfo({ phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: '#999' }]}>Special Requests (Optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: QuiloxColors.darkGray, color: '#fff' }]}
              placeholder="Any special requirements or requests..."
              placeholderTextColor="#666"
              value={guestInfo.specialRequests}
              onChangeText={(text) => setGuestInfo({ specialRequests: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={[styles.termsCard, { backgroundColor: QuiloxColors.darkGray }]}>
          <IconSymbol name="info.circle" size={20} color={QuiloxColors.gold} />
          <Text style={[styles.termsText, { color: '#999' }]}>
            By confirming this booking, you agree to Quilox's terms and conditions. Booking fee is non-refundable.
          </Text>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            {
              backgroundColor:
                guestInfo.name && guestInfo.email && guestInfo.phone && !submitting ? QuiloxColors.gold : QuiloxColors.darkGray,
            },
          ]}
          onPress={handleConfirmBooking}
          disabled={!guestInfo.name || !guestInfo.email || !guestInfo.phone || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={QuiloxColors.black} />
          ) : (
            <Text
              style={[
                styles.confirmText,
                { color: guestInfo.name && guestInfo.email && guestInfo.phone ? QuiloxColors.black : '#666' },
              ]}
            >
              Confirm Booking
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
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    fontSize: 16,
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  textArea: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 100,
  },
  termsCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  footer: { padding: 20, paddingBottom: 40 },
  confirmButton: { padding: 18, borderRadius: 12, alignItems: 'center' },
  confirmText: { fontSize: 16, fontWeight: 'bold' },
});
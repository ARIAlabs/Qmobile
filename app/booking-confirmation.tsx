import PaystackModal from '@/components/PaystackModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { useBooking } from '@/context/BookingContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { complianceManager, DataCategory, LegalBasis } from '@/lib/compliance';
import { paystackClient } from '@/lib/paystack';
import {
  createBookingWithPayment,
  supabase,
  verifyPaystackTransaction
} from '@/lib/supabase';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function BookingConfirmationScreen() {
  const colorScheme = useColorScheme();
  const isDark = true;
  const { selectedDate, guestCount, selectedTable, guestInfo, setGuestInfo, resetBooking } = useBooking();
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [pendingPaymentRef, setPendingPaymentRef] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');

  useEffect(() => {
    loadUser();
    
    // Listen for deep link from payment
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription.remove();
    };
  }, []);

  // For Expo Go: verify payment when app returns to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && pendingPaymentRef) {
        console.log('App returned to foreground, verifying payment:', pendingPaymentRef);
        await handlePaymentVerification(pendingPaymentRef);
        setPendingPaymentRef(null);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [pendingPaymentRef]);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleDeepLink = async (event: { url: string }) => {
    const url = event.url;
    console.log('Deep link received:', url);

    // Check if this is a payment callback
    if (url.includes('payment-callback')) {
      const queryString = url.includes('?') ? url.split('?')[1] : '';
      const params = new URLSearchParams(queryString);
      const reference = params.get('reference') || params.get('trxref');

      if (reference) {
        await handlePaymentVerification(reference);
      } else {
        setProcessingPayment(false);
        Alert.alert('Payment Failed', 'Your payment was not successful. Please try again.');
      }
    }
  };

  const handlePaymentVerification = async (reference: string) => {
    setProcessingPayment(true);
    
    try {
      console.log('Verifying payment:', reference);

      // Verify the transaction with Paystack
      const verificationResult = await verifyPaystackTransaction(reference);

      if (!verificationResult.success) {
        throw new Error(verificationResult.error || 'Payment verification failed');
      }

      const paymentData = verificationResult.data;

      // Validate payment amount matches booking fee
      const paidAmount = typeof paymentData.amount === 'number' ? paymentData.amount / 100 : 0;
      if (paidAmount < selectedTable!.booking_fee) {
        throw new Error('Payment amount does not match booking fee');
      }

      // Create the booking with payment confirmation
      await createBookingAfterPayment(reference, paymentData);

    } catch (error: any) {
      console.error('Payment verification error:', error);
      Alert.alert(
        'Verification Error',
        'We could not verify your payment. Please contact support with your payment reference.'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const createBookingAfterPayment = async (
    paymentRef: string,
    paymentData: any
  ) => {
    try {
      const bookingData = {
        user_id: userId,
        table_id: selectedTable!.id,
        booking_date: selectedDate!.toISOString().split('T')[0],
        guest_count: guestCount,
        guest_name: guestInfo.name,
        guest_email: guestInfo.email,
        guest_phone: guestInfo.phone,
        special_requests: guestInfo.specialRequests || null,
        status: 'confirmed' as const,
        booking_fee: selectedTable!.booking_fee,
      };

      const result = await createBookingWithPayment(
        bookingData,
        paymentRef,
        paymentRef
      );

      if (result.success) {
        Alert.alert(
          'Booking Confirmed! 🎉',
          `Your table has been reserved and payment of ₦${selectedTable!.booking_fee.toLocaleString()} has been processed.\n\nBooking Date: ${selectedDate!.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}\n\nWe'll send a confirmation email to ${guestInfo.email}.`,
          [
            {
              text: 'View My Bookings',
              onPress: () => {
                resetBooking();
                router.push('/booking-history');
              },
            },
            {
              text: 'Done',
              onPress: () => {
                resetBooking();
                router.push('/(tabs)');
              },
            },
          ]
        );
      } else {
        throw new Error(result.error || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('Booking creation error:', error);
      Alert.alert(
        'Booking Error',
        'Payment successful but booking creation failed. Please contact support with your payment reference.'
      );
    }
  };

  const handleInitiatePayment = async () => {
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
      const txRef = `BOOKING-${Date.now()}-${userId?.substring(0, 8)}`;
      // Build redirect URL - use scheme for standalone, or Expo Go format for dev
      const isExpoGo = Constants.appOwnership === 'expo';
      let callbackUrl: string;
      if (Platform.OS === 'web') {
        callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/payment-callback` : 'https://quilox.com/payment-callback';
      } else if (isExpoGo) {
        // Manually build exp:// URL for Expo Go dev
        const debuggerHost = Constants.expoConfig?.hostUri;
        callbackUrl = debuggerHost ? `exp://${debuggerHost}/--/payment-callback` : 'quiloxluxury://payment-callback';
      } else {
        callbackUrl = 'quiloxluxury://payment-callback';
      }

      console.log('Callback URL:', callbackUrl);

      console.log('Initiating payment:', {
        amount: selectedTable.booking_fee,
        txRef,
        email: guestInfo.email,
      });

      const paymentResponse = await paystackClient.initializeTransaction({
        reference: txRef,
        amount: selectedTable.booking_fee,
        currency: 'NGN',
        email: guestInfo.email,
        callback_url: callbackUrl,
        channels: ['card', 'bank_transfer', 'ussd'],
        metadata: {
          purpose: 'table_booking',
          table_id: selectedTable.id,
          booking_date: selectedDate.toISOString().split('T')[0],
        },
      });

      if (!paymentResponse.success || !paymentResponse.paymentLink) {
        throw new Error(paymentResponse.error || 'Failed to initiate payment');
      }

      console.log('Payment link generated:', paymentResponse.paymentLink);

      // Open payment modal (keeps user in app)
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.location.href = paymentResponse.paymentLink;
        }
      } else {
        // Use in-app modal for payment
        console.log('Opening payment modal...');
        setPendingPaymentRef(txRef);
        setPaymentUrl(paymentResponse.paymentLink);
        setShowPaymentModal(true);
      }

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to initiate payment. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    console.log('Payment success from modal, reference:', reference);
    setShowPaymentModal(false);
    setPaymentUrl('');
    await handlePaymentVerification(reference);
  };

  const handlePaymentCancel = () => {
    console.log('Payment cancelled');
    setShowPaymentModal(false);
    setPaymentUrl('');
    setPendingPaymentRef(null);
    Alert.alert('Payment Cancelled', 'You cancelled the payment. Please try again when ready.');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error from modal:', error);
    setShowPaymentModal(false);
    setPaymentUrl('');
    setPendingPaymentRef(null);
    Alert.alert('Payment Error', error || 'An error occurred during payment. Please try again.');
  };

  if (processingPayment) {
    return (
      <View style={[styles.container, { backgroundColor: QuiloxColors.black, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={QuiloxColors.gold} />
        <Text style={{ color: '#fff', marginTop: 20, fontSize: 18 }}>
          Verifying Payment...
        </Text>
        <Text style={{ color: '#999', marginTop: 10, textAlign: 'center', paddingHorizontal: 40 }}>
          Please wait while we confirm your payment
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Guest Details</Text>
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

        {/* Payment Info */}
        <View style={[styles.paymentInfoCard, { backgroundColor: QuiloxColors.darkGray, borderColor: QuiloxColors.gold }]}>
          <IconSymbol name="lock.shield" size={24} color={QuiloxColors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.paymentInfoTitle, { color: QuiloxColors.gold }]}>
              Secure Payment via Paystack
            </Text>
            <Text style={[styles.paymentInfoText, { color: '#999' }]}>
              Your payment is processed securely through Paystack. We accept cards, bank transfers, and USSD.
            </Text>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={[styles.termsCard, { backgroundColor: QuiloxColors.darkGray }]}>
          <IconSymbol name="info.circle" size={20} color={QuiloxColors.gold} />
          <Text style={[styles.termsText, { color: '#999' }]}>
            By proceeding to payment, you agree to Quilox's terms and conditions. Booking fee is non-refundable.
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
          onPress={handleInitiatePayment}
          disabled={!guestInfo.name || !guestInfo.email || !guestInfo.phone || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={QuiloxColors.black} />
          ) : (
            <>
              <IconSymbol name="creditcard" size={20} color={QuiloxColors.black} />
              <Text
                style={[
                  styles.confirmText,
                  { color: guestInfo.name && guestInfo.email && guestInfo.phone ? QuiloxColors.black : '#666' },
                ]}
              >
                Proceed to Payment - ₦{selectedTable?.booking_fee.toLocaleString() || '0'}
              </Text>
            </>
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
  paymentInfoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  paymentInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentInfoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  footer: { padding: 20, paddingBottom: 40 },
  confirmButton: { 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confirmText: { fontSize: 16, fontWeight: 'bold' },
});

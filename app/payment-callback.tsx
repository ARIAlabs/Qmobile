import { QuiloxColors } from '@/constants/theme';
import { verifyPaystackTransaction } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function PaymentCallbackScreen() {
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    handlePaymentCallback();
  }, []);

  const handlePaymentCallback = async () => {
    try {
      const { reference, trxref } = params as any;
      const paymentReference = (reference || trxref) as string | undefined;

      if (!paymentReference) {
        setStatus('error');
        setMessage('Payment was not successful. Please try again.');
        setTimeout(() => router.replace('/booking'), 3000);
        return;
      }

      console.log('Verifying payment:', paymentReference);

      // Verify the transaction
      const verificationResult = await verifyPaystackTransaction(paymentReference);

      if (!verificationResult.success) {
        setStatus('error');
        setMessage('Payment verification failed. Please contact support.');
        return;
      }

      // Payment verified successfully
      setStatus('success');
      setMessage('Payment successful! Redirecting to your booking...');
      
      // Redirect to booking history after short delay
      setTimeout(() => {
        router.replace('/booking-history');
      }, 2000);

    } catch (error: any) {
      console.error('Payment callback error:', error);
      setStatus('error');
      setMessage('An error occurred. Please contact support.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      <View style={styles.content}>
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color={QuiloxColors.gold} />
            <Text style={styles.title}>Processing Payment</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={[styles.title, { color: QuiloxColors.gold }]}>Payment Successful!</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </>
        )}

        {status === 'error' && (
          <>
            <Text style={styles.errorIcon}>✗</Text>
            <Text style={[styles.title, { color: '#ff4444' }]}>Payment Failed</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 40,
  },
  successIcon: {
    fontSize: 80,
    color: QuiloxColors.gold,
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 80,
    color: '#ff4444',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});

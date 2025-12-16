/**
 * Paystack Diagnostic & Test Screen
 * Tests API connection, authentication, and key configuration
 */


import { IconSymbol } from '@/components/ui/icon-symbol';
import { QuiloxColors } from '@/constants/theme';
import { paystackClient } from '@/lib/paystack';
import { logger } from '@/utils/logger';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  message?: string;
  details?: any;
  duration?: number;
}

export default function PaystackTestScreen() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Environment Variables', status: 'pending' },
    { name: 'API Connection', status: 'pending' },
    { name: 'Transaction Verification (Simulation)', status: 'pending' },
  ]);
  const [running, setRunning] = useState(false);
  const [envConfig, setEnvConfig] = useState<{
    secretKey: string;
  } | null>(null);


  // Check environment variables on mount
  useEffect(() => {
    checkEnvironmentVariables();
  }, []);

  const checkEnvironmentVariables = () => {
    const secretKey = process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY || '';

    setEnvConfig({
      secretKey: secretKey ? `${secretKey.substring(0, 15)}...` : 'NOT SET',
    });
  };


  const updateTestStatus = (index: number, update: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, ...update } : test))
    );
  };

  const runAllTests = async () => {
    setRunning(true);
    logger.info('🧪 Starting Paystack diagnostic tests...');


    // Test 1: Environment Variables
    await testEnvironmentVariables(0);

    // Test 2: API Connection
    await testApiConnection(1);

    // Test 3: Transaction Verification (Dry Run)
    await testTransactionVerification(2);


    setRunning(false);
    logger.info('✅ All tests completed');
  };

  const testEnvironmentVariables = async (index: number) => {

    updateTestStatus(index, { status: 'running' });
    const startTime = Date.now();

    try {
      const secretKey = process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY || '';

      const missing = [];
      if (!secretKey) missing.push('EXPO_PUBLIC_PAYSTACK_SECRET_KEY');


      if (missing.length > 0) {
        throw new Error(`Missing keys: ${missing.join(', ')}`);
      }

      if (typeof secretKey === 'string' && (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_'))) {
        throw new Error('Secret key format appears invalid (should start with sk_test_ or sk_live_)');
      }


      const duration = Date.now() - startTime;
      updateTestStatus(index, {
        status: 'success',
        message: 'All environment variables configured correctly',
        details: {
          secretKey: typeof secretKey === 'string' ? `${secretKey.substring(0, 20)}...` : 'NOT SET',
        },
        duration,
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestStatus(index, {
        status: 'failed',
        message: error.message,
        duration,
      });
      logger.error('Environment check failed:', error);
    }
  };

  const testApiConnection = async (index: number) => {
    updateTestStatus(index, { status: 'running' });
    const startTime = Date.now();

    try {
      const response = await paystackClient.verifyTransaction('paystack-diagnostic-test');

      if (response.success) {
        throw new Error('Unexpected success for diagnostic reference');
      }

      const duration = Date.now() - startTime;
      updateTestStatus(index, {
        status: 'success',
        message: 'API connection successful (received expected failure for dummy reference)',
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestStatus(index, {
        status: 'failed',
        message: error.message,
        duration,
      });
      logger.error('API connection test failed:', error);
    }
  };

  const testTransactionVerification = async (index: number) => {
    updateTestStatus(index, { status: 'running' });
    const startTime = Date.now();

    try {
      const response = await paystackClient.verifyTransaction('paystack-diagnostic-test');

      if (response.success) {
        throw new Error('Unexpected success for diagnostic reference');
      }

      const duration = Date.now() - startTime;
      updateTestStatus(index, {
        status: 'success',
        message: 'Verification endpoint reachable (expected failure for dummy reference)',
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestStatus(index, {
        status: 'failed',
        message: error.message,
        duration,
      });
      logger.error('Transaction verification test failed:', error);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return { name: 'circle', color: '#666' };
      case 'running':
        return { name: 'clock', color: QuiloxColors.gold };
      case 'success':
        return { name: 'checkmark.circle.fill', color: QuiloxColors.success };
      case 'failed':
        return { name: 'xmark.circle.fill', color: '#ef4444' };
      default:
        return { name: 'circle', color: '#666' };
    }
  };

  const allTestsPassed = tests.every((t) => t.status === 'success');
  const anyTestFailed = tests.some((t) => t.status === 'failed');
  const hasRun = tests.some((t) => t.status !== 'pending');

  return (
    <View style={[styles.container, { backgroundColor: QuiloxColors.black }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Paystack Diagnostics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Environment Info */}
        <View style={[styles.card, { backgroundColor: QuiloxColors.darkGray }]}>
          <View style={styles.cardHeader}>
            <IconSymbol name="key.fill" size={24} color={QuiloxColors.gold} />
            <Text style={[styles.cardTitle, { color: '#fff' }]}>API Keys Configuration</Text>
          </View>
          
          {envConfig && (
            <View style={styles.envList}>
              <View style={styles.envItem}>
                <Text style={styles.envLabel}>Secret Key:</Text>
                <Text style={[styles.envValue, { color: envConfig.secretKey !== 'NOT SET' ? QuiloxColors.success : '#ef4444' }]}>
                  {envConfig.secretKey}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Test Results */}
        <View style={[styles.card, { backgroundColor: QuiloxColors.darkGray }]}>
          <View style={styles.cardHeader}>
            <IconSymbol name="list.bullet.clipboard" size={24} color={QuiloxColors.gold} />
            <Text style={[styles.cardTitle, { color: '#fff' }]}>Diagnostic Tests</Text>
          </View>

          <View style={styles.testsList}>
            {tests.map((test, index) => {
              const icon = getStatusIcon(test.status);
              return (
                <View key={index} style={[styles.testItem, { backgroundColor: QuiloxColors.mediumGray }]}>
                  <View style={styles.testHeader}>
                    <View style={styles.testNameRow}>
                      {test.status === 'running' ? (
                        <ActivityIndicator size="small" color={QuiloxColors.gold} />
                      ) : (
                        <IconSymbol name={icon.name as any} size={24} color={icon.color} />
                      )}
                      <Text style={[styles.testName, { color: '#fff' }]}>{test.name}</Text>
                    </View>
                    {test.duration !== undefined && (
                      <Text style={[styles.testDuration, { color: '#999' }]}>
                        {test.duration}ms
                      </Text>
                    )}
                  </View>
                  {test.message && (
                    <Text
                      style={[
                        styles.testMessage,
                        { color: test.status === 'success' ? QuiloxColors.success : test.status === 'failed' ? '#ef4444' : '#999' },
                      ]}
                    >
                      {test.message}
                    </Text>
                  )}
                  {test.details && (
                    <View style={styles.testDetails}>
                      <Text style={[styles.detailsLabel, { color: '#999' }]}>Details:</Text>
                      <Text style={[styles.detailsText, { color: '#ccc' }]}>
                        {JSON.stringify(test.details, null, 2)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Summary */}
        {hasRun && (
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: allTestsPassed ? QuiloxColors.success + '20' : anyTestFailed ? '#ef444420' : QuiloxColors.gold + '20',
                borderColor: allTestsPassed ? QuiloxColors.success : anyTestFailed ? '#ef4444' : QuiloxColors.gold,
              },
            ]}
          >
            <IconSymbol
              name={allTestsPassed ? 'checkmark.seal.fill' : anyTestFailed ? 'exclamationmark.triangle.fill' : 'info.circle.fill'}
              size={32}
              color={allTestsPassed ? QuiloxColors.success : anyTestFailed ? '#ef4444' : QuiloxColors.gold}
            />
            <Text style={[styles.summaryTitle, { color: '#fff' }]}>
              {allTestsPassed ? 'All Tests Passed! ✅' : anyTestFailed ? 'Some Tests Failed ❌' : 'Tests Running...'}
            </Text>
            <Text style={[styles.summaryText, { color: '#ccc' }]}>
              {allTestsPassed
                ? 'Your Paystack integration is configured correctly and ready to use.'
                : anyTestFailed
                ? 'Please check the failed tests above and verify your API keys in .env.development'
                : 'Running diagnostic tests...'}
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View style={[styles.card, { backgroundColor: QuiloxColors.darkGray }]}>
          <View style={styles.cardHeader}>
            <IconSymbol name="info.circle" size={24} color={QuiloxColors.gold} />
            <Text style={[styles.cardTitle, { color: '#fff' }]}>Next Steps</Text>
          </View>
          <View style={styles.instructions}>
            <Text style={[styles.instructionText, { color: '#ccc' }]}>
              {allTestsPassed
                ? '• Go to the Privé tab\n• Complete onboarding to create your virtual account\n• Start making bookings to activate Privé wallet'
                : '• Verify your Paystack API keys in .env.development\n• Ensure you\'re using test keys for testing\n• Check your internet connection\n• Re-run tests after fixing issues'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Run Tests Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.runButton,
            {
              backgroundColor: running ? QuiloxColors.darkGray : QuiloxColors.gold,
            },
          ]}
          onPress={runAllTests}
          disabled={running}
        >
          {running ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.runButtonText, { color: '#fff' }]}>Running Tests...</Text>
            </>
          ) : (
            <>
              <IconSymbol name="play.circle.fill" size={24} color={QuiloxColors.black} />
              <Text style={[styles.runButtonText, { color: QuiloxColors.black }]}>
                {hasRun ? 'Re-run Tests' : 'Run Diagnostic Tests'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  envList: {
    gap: 12,
  },
  envItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  envLabel: {
    fontSize: 14,
    color: '#999',
  },
  envValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  testsList: {
    gap: 12,
  },
  testItem: {
    borderRadius: 12,
    padding: 16,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
  },
  testDuration: {
    fontSize: 12,
  },
  testMessage: {
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 36,
  },
  testDetails: {
    marginLeft: 36,
    marginTop: 8,
  },
  detailsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructions: {
    paddingTop: 8,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 12,
  },
  runButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
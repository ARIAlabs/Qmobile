import { QuiloxColors } from '@/constants/theme';
import React, { useRef } from 'react';
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

interface PaystackModalProps {
  visible: boolean;
  paymentUrl: string;
  reference: string;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export default function PaystackModal({
  visible,
  paymentUrl,
  reference,
  onSuccess,
  onCancel,
  onError,
}: PaystackModalProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = React.useState(true);
  const hasCalledSuccess = useRef(false);
  const lastProcessedUrl = useRef<string>('');

  // Reset flags when modal becomes visible with new payment
  React.useEffect(() => {
    if (visible && paymentUrl) {
      hasCalledSuccess.current = false;
      lastProcessedUrl.current = '';
    }
  }, [visible, paymentUrl]);

  const handleSuccess = (ref: string) => {
    // Prevent multiple calls to onSuccess
    if (hasCalledSuccess.current) {
      console.log('=== MODAL: Already called success, BLOCKING ===');
      return;
    }
    hasCalledSuccess.current = true;
    console.log('=== MODAL: Calling onSuccess ONCE ===', ref);
    onSuccess(ref);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url, loading: isLoading } = navState;
    
    // Only process when page has FINISHED loading (not when it starts)
    if (isLoading) {
      return;
    }
    
    // Skip if same URL as last processed
    if (url === lastProcessedUrl.current) {
      return;
    }
    lastProcessedUrl.current = url;
    
    console.log('=== NAV COMPLETE:', url);

    // Check for success callback patterns
    if (url.includes('payment-callback') || url.includes('trxref=') || url.includes('reference=')) {
      // Extract reference from URL
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const ref = urlParams.get('reference') || urlParams.get('trxref') || reference;
      console.log('=== NAV: Success URL detected, ref:', ref);
      handleSuccess(ref);
      return;
    }

    // Check for cancel/close patterns
    if (url.includes('cancel') || url.includes('close')) {
      onCancel();
      return;
    }
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);

      // Only handle close/cancel - success is handled via URL navigation ONLY
      if (data.event === 'cancel' || data.event === 'close') {
        onCancel();
      } else if (data.event === 'error') {
        onError(data.message || 'Payment failed');
      }
      // NOTE: Success events are IGNORED here to prevent duplicates
    } catch (e) {
      // Not a JSON message, ignore
    }
  };

  // Minimal JS - only handle window.close, NO success detection here
  // Success is detected ONLY via handleNavigationStateChange to prevent duplicates
  const injectedJavaScript = `
    (function() {
      window.close = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'close' }));
      };
    })();
    true;
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Text style={styles.closeText}>✕ Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <View style={styles.placeholder} />
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={QuiloxColors.gold} />
            <Text style={styles.loadingText}>Loading payment...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          injectedJavaScript={injectedJavaScript}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            onError('Failed to load payment page');
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: QuiloxColors.black,
    borderBottomWidth: 1,
    borderBottomColor: QuiloxColors.gold + '30',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: QuiloxColors.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 80,
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
});

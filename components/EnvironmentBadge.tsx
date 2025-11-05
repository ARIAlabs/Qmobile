import { config } from '@/config/environment';
import { StyleSheet, Text, View } from 'react-native';

export function EnvironmentBadge() {
  // Safe config access with error handling
  try {
    // Only show in development and staging
    if (!config || config.isProduction) return null;

    const bgColor = config.isDevelopment ? '#2563eb' : '#ca8a04'; // blue-600 : yellow-600
    const label = config.env.toUpperCase();

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Text style={styles.text}>{label}</Text>
      </View>
    );
  } catch (error) {
    // Silently fail if config is not ready
    console.warn('EnvironmentBadge: Config not ready', error);
    return null;
  }
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  text: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
})
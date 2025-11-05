/**
 * Environment Configuration
 * Single backend with environment-based feature flags
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  env: Environment;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  features: {
    enableLogging: boolean;
    enableAnalytics: boolean;
    enableDebugMode: boolean;
    enableCrashReporting: boolean;
    enableTestMode: boolean;
    enableMockPayments: boolean;
  };
  api: {
    version: string;
    timeout: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabled: boolean;
  };
}

/**
 * Detect current environment based on Expo environment variables
 */
function detectEnvironment(): Environment {
  // Check EXPO_PUBLIC_ENVIRONMENT first
  const envVar = process.env.EXPO_PUBLIC_ENVIRONMENT;
  
  if (envVar === 'production') return 'production';
  if (envVar === 'staging') return 'staging';
  if (envVar === 'development') return 'development';
  
  // Fallback: Check __DEV__ flag (Expo/React Native)
  if (__DEV__) {
    return 'development';
  }
  
  // For web, check hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    
    if (hostname.includes('staging') || hostname.includes('preview')) {
      return 'staging';
    }
  }
  
  return 'production';
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = detectEnvironment();
  
  const baseConfig = {
    env,
    isDevelopment: env === 'development',
    isStaging: env === 'staging',
    isProduction: env === 'production',
    api: {
      version: '1.0.0',
      timeout: 30000,
    },
  };

  // Development configuration
  if (env === 'development') {
    return {
      ...baseConfig,
      features: {
        enableLogging: true,
        enableAnalytics: false,
        enableDebugMode: true,
        enableCrashReporting: false,
        enableTestMode: true,
        enableMockPayments: true,
      },
      logging: {
        level: 'debug',
        enabled: true,
      },
    };
  }

  // Staging configuration
  if (env === 'staging') {
    return {
      ...baseConfig,
      features: {
        enableLogging: true,
        enableAnalytics: true,
        enableDebugMode: false,
        enableCrashReporting: true,
        enableTestMode: true,
        enableMockPayments: true,
      },
      logging: {
        level: 'info',
        enabled: true,
      },
    };
  }

  // Production configuration
  return {
    ...baseConfig,
    features: {
      enableLogging: false,
      enableAnalytics: true,
      enableDebugMode: false,
      enableCrashReporting: true,
      enableTestMode: false,
      enableMockPayments: false,
    },
    logging: {
      level: 'error',
      enabled: true,
    },
  };
}

// Export singleton instance
let _config: EnvironmentConfig | null = null;

export const config = (() => {
  if (!_config) {
    _config = getEnvironmentConfig();
    
    // Log environment info in development
    if (_config.isDevelopment) {
      console.log('🔧 Environment:', _config.env);
      console.log('⚙️ Config:', _config);
    }
  }
  return _config;
})();
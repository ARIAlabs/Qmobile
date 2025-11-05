/**
 * Logging and Monitoring Service
 * 
 * Provides centralized logging, error tracking, and performance monitoring
 * for API calls and application activities.
 * 
 * Features:
 * - Structured logging with severity levels
 * - API call performance tracking
 * - Error tracking and reporting
 * - User activity monitoring
 * - Production-safe logging (respects __DEV__ flag)
 * - In-memory log storage with export capability
 * - Slow operation detection and alerting
 * 
 * @example
 * ```typescript
 * import { logger, logAPI } from '[/lib/logger';](cci:4://file:///lib/logger';:0:0-0:0)
 * 
 * // Track API call with automatic performance monitoring
 * const data = await logAPI('fetchProducts', async () => {
 *   return await supabase.from('products').select('*');
 * });
 * 
 * // Log user activity
 * logger.trackActivity('product_viewed', 'shop', { productId: '123' });
 * 
 * // Log errors
 * logger.error('Failed to load data', error, { context: 'homepage' });
 * ```
 */

import { Platform } from 'react-native';

/**
 * Log severity levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',   // Detailed debug information (development only)
  INFO = 'INFO',     // General informational messages
  WARN = 'WARN',     // Warning messages
  ERROR = 'ERROR',   // Error messages
  FATAL = 'FATAL',   // Critical failures
}

/**
 * API call metadata for tracking
 */
interface APICallMetadata {
  endpoint: string;
  method?: string;
  duration?: number;
  status?: 'success' | 'error';
  errorMessage?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * User activity metadata
 */
interface UserActivityMetadata {
  action: string;
  screen?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Performance metric
 */
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Log entry structure
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
  platform: string;
}

/**
 * Logger class - Singleton pattern
 */
class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private isDevelopment = __DEV__;
  
  // Performance thresholds (milliseconds)
  private readonly SLOW_API_THRESHOLD = 3000;
  private readonly VERY_SLOW_API_THRESHOLD = 5000;

  private constructor() {
    this.info('Logger initialized', {
      platform: Platform.OS,
      environment: this.isDevelopment ? 'development' : 'production',
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console output based on environment and level
    if (this.shouldLogToConsole(level)) {
      const consoleMethod = this.getConsoleMethod(level);
      const formattedMessage = this.formatLogMessage(level, message);
      
      if (metadata) {
        consoleMethod(formattedMessage, metadata);
      } else {
        consoleMethod(formattedMessage);
      }
    }

    // TODO: Send to remote logging service in production
    // Examples: Sentry, LogRocket, Bugsnag, Firebase Crashlytics
    // if (!this.isDevelopment && (level === LogLevel.ERROR || level === LogLevel.FATAL)) {
    //   this.sendToRemote(logEntry);
    // }
  }

  /**
   * Determine if log should be written to console
   */
  private shouldLogToConsole(level: LogLevel): boolean {
    // In development, log everything
    if (this.isDevelopment) return true;
    
    // In production, only log warnings, errors, and fatal
    return level === LogLevel.WARN || level === LogLevel.ERROR || level === LogLevel.FATAL;
  }

  /**
   * Get appropriate console method for log level
   */
  private getConsoleMethod(level: LogLevel): any {
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        return console.log;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Format log message with timestamp and level
   */
  private formatLogMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = this.getLogEmoji(level);
    return `${emoji} [${level}] [${timestamp}] ${message}`;
  }

  /**
   * Get emoji for log level (better visibility in console)
   */
  private getLogEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      case LogLevel.FATAL:
        return '💀';
      default:
        return '📝';
    }
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, metadata?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, metadata);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Warning level logging
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    const errorMetadata = {
      ...metadata,
      errorMessage: error?.message || String(error),
      errorName: error?.name,
      stack: error?.stack,
    };
    this.log(LogLevel.ERROR, message, errorMetadata);
  }

  /**
   * Fatal error logging (critical failures)
   */
  fatal(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    const errorMetadata = {
      ...metadata,
      errorMessage: error?.message || String(error),
      errorName: error?.name,
      stack: error?.stack,
    };
    this.log(LogLevel.FATAL, message, errorMetadata);
  }

  /**
   * Track API call with automatic performance monitoring
   * 
   * @example
   * ```typescript
   * const products = await logger.trackAPICall('fetchProducts', async () => {
   *   return await supabase.from('products').select('*');
   * }, { category: 'apparel' });
   * ```
   */
  async trackAPICall<T>(
    endpoint: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    const callMetadata: Partial<APICallMetadata> = {
      endpoint,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    try {
      this.debug(`API Call Started: ${endpoint}`, metadata);
      
      const result = await operation();
      
      const duration = Date.now() - startTime;
      const successMetadata: APICallMetadata = {
        ...callMetadata as APICallMetadata,
        duration,
        status: 'success',
      };

      this.info(`API Call Success: ${endpoint}`, {
        ...successMetadata,
        durationFormatted: `${duration}ms`,
      });

      // Track performance
      this.trackPerformance(`api_${endpoint}`, duration, metadata);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMetadata: APICallMetadata = {
        ...callMetadata as APICallMetadata,
        duration,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
      };

      this.error(`API Call Failed: ${endpoint}`, error, {
        ...errorMetadata,
        durationFormatted: `${duration}ms`,
      });

      throw error;
    }
  }

  /**
   * Track user activity for analytics
   * 
   * @example
   * ```typescript
   * logger.trackActivity('product_viewed', 'shop', { 
   *   productId: '123',
   *   productName: 'Black Hoodie'
   * });
   * ```
   */
  trackActivity(
    action: string,
    screen?: string,
    metadata?: Record<string, any>
  ): void {
    const activity: UserActivityMetadata = {
      action,
      screen,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.info(`User Activity: ${action}`, {
      screen,
      ...metadata,
    });

    // TODO: Send to analytics service
    // Examples: Firebase Analytics, Mixpanel, Amplitude
    // this.sendToAnalytics(activity);
  }

  /**
   * Track performance metric with automatic slow operation detection
   * 
   * @example
   * ```typescript
   * const start = Date.now();
   * await fetchData();
   * logger.trackPerformance('data_fetch', Date.now() - start);
   * ```
   */
  trackPerformance(
    name: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.debug(`Performance: ${name} - ${duration}ms`, metadata);

    // Alert on very slow operations
    if (duration > this.VERY_SLOW_API_THRESHOLD) {
      this.error(`Very slow operation detected: ${name}`, undefined, {
        duration: `${duration}ms`,
        threshold: `${this.VERY_SLOW_API_THRESHOLD}ms`,
        severity: 'critical',
        ...metadata,
      });
    }
    // Warn on slow operations
    else if (duration > this.SLOW_API_THRESHOLD) {
      this.warn(`Slow operation detected: ${name}`, {
        duration: `${duration}ms`,
        threshold: `${this.SLOW_API_THRESHOLD}ms`,
        severity: 'warning',
        ...metadata,
      });
    }

    // TODO: Send to performance monitoring service
    // Examples: Firebase Performance, New Relic, Datadog
    // this.sendToPerformanceMonitor(metric);
  }

  /**
   * Get recent logs (for debugging)
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get error logs only
   */
  getErrors(): LogEntry[] {
    return this.logs.filter(
      log => log.level === LogLevel.ERROR || log.level === LogLevel.FATAL
    );
  }

  /**
   * Export logs as JSON string (for support/debugging)
   */
  exportLogs(): string {
    return JSON.stringify({
      platform: Platform.OS,
      environment: this.isDevelopment ? 'development' : 'production',
      exportedAt: new Date().toISOString(),
      totalLogs: this.logs.length,
      errorCount: this.getErrors().length,
      logs: this.logs,
    }, null, 2);
  }

  /**
   * Get log statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    errors: number;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0,
        [LogLevel.FATAL]: 0,
      },
      errors: 0,
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      if (log.level === LogLevel.ERROR || log.level === LogLevel.FATAL) {
        stats.errors++;
      }
    });

    return stats;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    const previousCount = this.logs.length;
    this.logs = [];
    this.info('Logs cleared', { previousCount });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export helper functions for convenience
export const logAPI = logger.trackAPICall.bind(logger);
export const logActivity = logger.trackActivity.bind(logger);
export const logPerformance = logger.trackPerformance.bind(logger);

// Export convenience methods
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
export const logFatal = logger.fatal.bind(logger);

// Export for advanced usage
export { Logger };


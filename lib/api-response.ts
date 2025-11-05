/**
 * API Response Codes and Standardized Response Format
 * 
 * Defines all HTTP status codes, custom error codes, and provides
 * standardized response format for all API operations.
 * 
 * Compliant with:
 * - HTTP/1.1 Status Code Definitions (RFC 7231)
 * - REST API best practices
 * - Banking API integration requirements
 * 
 * [module](cci:4://file://module:0:0-0:0) api-response
 */

/**
 * HTTP Status Codes
 * Standard HTTP response status codes as defined by RFC 7231
 */
export enum HttpStatusCode {
  // Success 2xx
  OK = 200,                    // Request succeeded
  CREATED = 201,               // Resource created successfully
  ACCEPTED = 202,              // Request accepted but not yet processed
  NO_CONTENT = 204,            // Success with no response body

  // Client Errors 4xx
  BAD_REQUEST = 400,           // Invalid request syntax or parameters
  UNAUTHORIZED = 401,          // Authentication required or failed
  FORBIDDEN = 403,             // Authenticated but not authorized
  NOT_FOUND = 404,             // Resource not found
  METHOD_NOT_ALLOWED = 405,    // HTTP method not supported
  CONFLICT = 409,              // Request conflicts with current state
  GONE = 410,                  // Resource permanently deleted
  UNPROCESSABLE_ENTITY = 422,  // Request syntax valid but semantically incorrect
  TOO_MANY_REQUESTS = 429,     // Rate limit exceeded

  // Server Errors 5xx
  INTERNAL_SERVER_ERROR = 500, // Unexpected server error
  NOT_IMPLEMENTED = 501,       // Functionality not implemented
  BAD_GATEWAY = 502,           // Invalid response from upstream server
  SERVICE_UNAVAILABLE = 503,   // Server temporarily unavailable
  GATEWAY_TIMEOUT = 504,       // Upstream server timeout
}

/**
 * Custom Application Error Codes
 * Application-specific error codes for detailed error tracking
 */
export enum AppErrorCode {
  // Authentication & Authorization (1xxx)
  AUTH_INVALID_TOKEN = 'AUTH_1001',
  AUTH_TOKEN_EXPIRED = 'AUTH_1002',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_1003',
  AUTH_INVALID_CREDENTIALS = 'AUTH_1004',
  
  // Validation Errors (2xxx)
  VALIDATION_MISSING_FIELD = 'VAL_2001',
  VALIDATION_INVALID_FORMAT = 'VAL_2002',
  VALIDATION_OUT_OF_RANGE = 'VAL_2003',
  VALIDATION_DUPLICATE_ENTRY = 'VAL_2004',
  
  // Business Logic Errors (3xxx)
  BOOKING_TABLE_UNAVAILABLE = 'BIZ_3001',
  BOOKING_INVALID_DATE = 'BIZ_3002',
  BOOKING_GUEST_COUNT_EXCEEDED = 'BIZ_3003',
  PRODUCT_OUT_OF_STOCK = 'BIZ_3004',
  PRODUCT_NOT_AVAILABLE = 'BIZ_3005',
  
  // Database Errors (4xxx)
  DB_CONNECTION_FAILED = 'DB_4001',
  DB_QUERY_FAILED = 'DB_4002',
  DB_CONSTRAINT_VIOLATION = 'DB_4003',
  DB_RECORD_NOT_FOUND = 'DB_4004',
  
  // External Service Errors (5xxx)
  EXT_SERVICE_UNAVAILABLE = 'EXT_5001',
  EXT_SERVICE_TIMEOUT = 'EXT_5002',
  EXT_PAYMENT_FAILED = 'EXT_5003',
  
  // Rate Limiting (6xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_6001',
  QUOTA_EXCEEDED = 'RATE_6002',
  
  // General Errors (9xxx)
  UNKNOWN_ERROR = 'ERR_9001',
  NETWORK_ERROR = 'ERR_9002',
  TIMEOUT_ERROR = 'ERR_9003',
}

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = any> {
  /** HTTP status code */
  statusCode: HttpStatusCode;
  
  /** Indicates if the request was successful */
  success: boolean;
  
  /** Response data (present on success) */
  data?: T;
  
  /** Error details (present on failure) */
  error?: ApiError;
  
  /** Response metadata */
  metadata?: ResponseMetadata;
  
  /** ISO 8601 timestamp */
  timestamp: string;
}

/**
 * Error response structure
 */
export interface ApiError {
  /** Application-specific error code */
  code: AppErrorCode | string;
  
  /** Human-readable error message */
  message: string;
  
  /** Detailed error description (optional) */
  details?: string;
  
  /** Field-specific errors for validation failures */
  fieldErrors?: FieldError[];
  
  /** Stack trace (development only) */
  stack?: string;
}

/**
 * Field-level validation error
 */
export interface FieldError {
  /** Field name */
  field: string;
  
  /** Error message for this field */
  message: string;
  
  /** Invalid value provided */
  value?: any;
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  /** Request ID for tracking */
  requestId?: string;
  
  /** API version */
  version?: string;
  
  /** Pagination info (for list endpoints) */
  pagination?: PaginationInfo;
  
  /** Performance metrics */
  performance?: {
    duration: number; // milliseconds
  };
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Response builder class for creating standardized API responses
 */
export class ApiResponseBuilder {
  /**
   * Create a success response
   */
  static success<T>(
    data: T,
    statusCode: HttpStatusCode = HttpStatusCode.OK,
    metadata?: ResponseMetadata
  ): ApiResponse<T> {
    return {
      statusCode,
      success: true,
      data,
      metadata,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create an error response
   */
  static error(
    code: AppErrorCode | string,
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    details?: string,
    fieldErrors?: FieldError[]
  ): ApiResponse {
    const error: ApiError = {
      code,
      message,
      details,
      fieldErrors,
    };

    // Include stack trace in development
    if (__DEV__) {
      error.stack = new Error().stack;
    }

    return {
      statusCode,
      success: false,
      error,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create response from Supabase error
   */
  static fromSupabaseError(error: any): ApiResponse {
    // Parse Supabase error
    const errorMessage = error?.message || 'An unexpected error occurred';
    const errorCode = error?.code || 'UNKNOWN';

    // Map Supabase errors to appropriate status codes
    let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    let appErrorCode = AppErrorCode.UNKNOWN_ERROR;

    if (errorCode === 'PGRST116') {
      // Record not found
      statusCode = HttpStatusCode.NOT_FOUND;
      appErrorCode = AppErrorCode.DB_RECORD_NOT_FOUND;
    } else if (errorCode === '23505') {
      // Unique constraint violation
      statusCode = HttpStatusCode.CONFLICT;
      appErrorCode = AppErrorCode.VALIDATION_DUPLICATE_ENTRY;
    } else if (errorCode === '23503') {
      // Foreign key constraint violation
      statusCode = HttpStatusCode.BAD_REQUEST;
      appErrorCode = AppErrorCode.DB_CONSTRAINT_VIOLATION;
    } else if (errorCode === '42501') {
      // Insufficient privilege (RLS)
      statusCode = HttpStatusCode.FORBIDDEN;
      appErrorCode = AppErrorCode.AUTH_INSUFFICIENT_PERMISSIONS;
    } else if (errorMessage.includes('JWT')) {
      // JWT authentication error
      statusCode = HttpStatusCode.UNAUTHORIZED;
      appErrorCode = AppErrorCode.AUTH_INVALID_TOKEN;
    }

    return this.error(
      appErrorCode,
      errorMessage,
      statusCode,
      error?.hint || error?.details
    );
  }

  /**
   * Wrap async operation with standardized response handling
   */
  static async handleRequest<T>(
    operation: () => Promise<T>,
    successMessage?: string
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();

    try {
      const data = await operation();
      const duration = Date.now() - startTime;

      return this.success(data, HttpStatusCode.OK, {
        performance: { duration },
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Handle Supabase-specific errors
      if (error?.code || error?.message?.includes('supabase')) {
        const response = this.fromSupabaseError(error);
        if (response.metadata) {
          response.metadata.performance = { duration };
        } else {
          response.metadata = { performance: { duration } };
        }
        return response;
      }

      // Handle generic errors
      return this.error(
        AppErrorCode.UNKNOWN_ERROR,
        error?.message || 'An unexpected error occurred',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        error?.stack,
        undefined
      );
    }
  }
}

/**
 * HTTP Status Code Categories
 */
export const isSuccessStatus = (code: HttpStatusCode): boolean => {
  return code >= 200 && code < 300;
};

export const isClientErrorStatus = (code: HttpStatusCode): boolean => {
  return code >= 400 && code < 500;
};

export const isServerErrorStatus = (code: HttpStatusCode): boolean => {
  return code >= 500 && code < 600;
};

/**
 * Error code to HTTP status code mapping
 */
export const ERROR_CODE_TO_HTTP_STATUS: Record<AppErrorCode, HttpStatusCode> = {
  // Auth errors -> 401/403
  [AppErrorCode.AUTH_INVALID_TOKEN]: HttpStatusCode.UNAUTHORIZED,
  [AppErrorCode.AUTH_TOKEN_EXPIRED]: HttpStatusCode.UNAUTHORIZED,
  [AppErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: HttpStatusCode.FORBIDDEN,
  [AppErrorCode.AUTH_INVALID_CREDENTIALS]: HttpStatusCode.UNAUTHORIZED,
  
  // Validation errors -> 400/422
  [AppErrorCode.VALIDATION_MISSING_FIELD]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [AppErrorCode.VALIDATION_INVALID_FORMAT]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [AppErrorCode.VALIDATION_OUT_OF_RANGE]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [AppErrorCode.VALIDATION_DUPLICATE_ENTRY]: HttpStatusCode.CONFLICT,
  
  // Business logic errors -> 400/409
  [AppErrorCode.BOOKING_TABLE_UNAVAILABLE]: HttpStatusCode.CONFLICT,
  [AppErrorCode.BOOKING_INVALID_DATE]: HttpStatusCode.BAD_REQUEST,
  [AppErrorCode.BOOKING_GUEST_COUNT_EXCEEDED]: HttpStatusCode.BAD_REQUEST,
  [AppErrorCode.PRODUCT_OUT_OF_STOCK]: HttpStatusCode.CONFLICT,
  [AppErrorCode.PRODUCT_NOT_AVAILABLE]: HttpStatusCode.NOT_FOUND,
  
  // Database errors -> 500
  [AppErrorCode.DB_CONNECTION_FAILED]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [AppErrorCode.DB_QUERY_FAILED]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [AppErrorCode.DB_CONSTRAINT_VIOLATION]: HttpStatusCode.BAD_REQUEST,
  [AppErrorCode.DB_RECORD_NOT_FOUND]: HttpStatusCode.NOT_FOUND,
  
  // External service errors -> 502/503
  [AppErrorCode.EXT_SERVICE_UNAVAILABLE]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [AppErrorCode.EXT_SERVICE_TIMEOUT]: HttpStatusCode.GATEWAY_TIMEOUT,
  [AppErrorCode.EXT_PAYMENT_FAILED]: HttpStatusCode.BAD_GATEWAY,
  
  // Rate limiting -> 429
  [AppErrorCode.RATE_LIMIT_EXCEEDED]: HttpStatusCode.TOO_MANY_REQUESTS,
  [AppErrorCode.QUOTA_EXCEEDED]: HttpStatusCode.TOO_MANY_REQUESTS,
  
  // General errors -> 500
  [AppErrorCode.UNKNOWN_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [AppErrorCode.NETWORK_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [AppErrorCode.TIMEOUT_ERROR]: HttpStatusCode.GATEWAY_TIMEOUT,
};

/**
 * Get user-friendly error messages
 */
export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  // Auth
  [AppErrorCode.AUTH_INVALID_TOKEN]: 'Your session has expired. Please log in again.',
  [AppErrorCode.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [AppErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action.',
  [AppErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',
  
  // Validation
  [AppErrorCode.VALIDATION_MISSING_FIELD]: 'Required field is missing.',
  [AppErrorCode.VALIDATION_INVALID_FORMAT]: 'Invalid format provided.',
  [AppErrorCode.VALIDATION_OUT_OF_RANGE]: 'Value is out of acceptable range.',
  [AppErrorCode.VALIDATION_DUPLICATE_ENTRY]: 'This record already exists.',
  
  // Business Logic
  [AppErrorCode.BOOKING_TABLE_UNAVAILABLE]: 'This table is not available for the selected date.',
  [AppErrorCode.BOOKING_INVALID_DATE]: 'Invalid booking date. Please select a future date.',
  [AppErrorCode.BOOKING_GUEST_COUNT_EXCEEDED]: 'Guest count exceeds table capacity.',
  [AppErrorCode.PRODUCT_OUT_OF_STOCK]: 'This product is currently out of stock.',
  [AppErrorCode.PRODUCT_NOT_AVAILABLE]: 'This product is no longer available.',
  
  // Database
  [AppErrorCode.DB_CONNECTION_FAILED]: 'Unable to connect to database. Please try again later.',
  [AppErrorCode.DB_QUERY_FAILED]: 'Database operation failed. Please try again.',
  [AppErrorCode.DB_CONSTRAINT_VIOLATION]: 'Operation violates data constraints.',
  [AppErrorCode.DB_RECORD_NOT_FOUND]: 'Requested record not found.',
  
  // External Services
  [AppErrorCode.EXT_SERVICE_UNAVAILABLE]: 'External service temporarily unavailable.',
  [AppErrorCode.EXT_SERVICE_TIMEOUT]: 'External service request timed out.',
  [AppErrorCode.EXT_PAYMENT_FAILED]: 'Payment processing failed. Please try again.',
  
  // Rate Limiting
  [AppErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [AppErrorCode.QUOTA_EXCEEDED]: 'Usage quota exceeded.',
  
  // General
  [AppErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [AppErrorCode.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
  [AppErrorCode.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
};
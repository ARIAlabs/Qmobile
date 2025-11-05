/**
 * Globus Bank API Client
 * Handles virtual account creation, balance management, and transactions
 * 
 * API Documentation: https://sandbox.globusbank.com/docs
 * Base URL: https://sandbox.globusbank.com/api/v1
 */

import { logger } from '@/utils/logger';
import { config } from '@/config/environment';

// ==================== TYPES & INTERFACES ====================

export interface GlobusBankConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

export interface VirtualAccount {
  accountNumber: string;
  accountName: string;
  bank Name: string;
  bankCode: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bvn?: string; // Bank Verification Number (optional for sandbox)
}

export interface CreateAccountResponse {
  success: boolean;
  data?: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    reference: string;
  };
  message?: string;
  error?: string;
}

export interface BalanceResponse {
  success: boolean;
  data?: {
    accountNumber: string;
    availableBalance: number;
    ledgerBalance: number;
    currency: string;
  };
  error?: string;
}

export interface Transaction {
  id: string;
  reference: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  status: 'pending' | 'successful' | 'failed';
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export interface TransactionHistoryResponse {
  success: boolean;
  data?: {
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  };
  error?: string;
}

export interface TransferRequest {
  sourceAccount: string;
  destinationAccount: string;
  destinationBankCode: string;
  amount: number;
  narration: string;
  reference?: string;
}

export interface TransferResponse {
  success: boolean;
  data?: {
    reference: string;
    status: string;
    message: string;
  };
  error?: string;
}

// ==================== API CLIENT CLASS ====================

class GlobusBankClient {
  private config: GlobusBankConfig;
  private timeout = 30000; // 30 seconds

  constructor() {
    // Load from environment variables
    const apiKey = process.env.EXPO_PUBLIC_GLOBUS_API_KEY || '';
    const secretKey = process.env.EXPO_PUBLIC_GLOBUS_SECRET_KEY || '';
    
    this.config = {
      apiKey,
      secretKey,
      baseUrl: config.isProduction
        ? 'https://api.globusbank.com/v1'
        : 'https://sandbox.globusbank.com/api/v1',
      environment: config.isProduction ? 'production' : 'sandbox',
    };

    if (!apiKey || !secretKey) {
      logger.warn('Globus Bank credentials not configured. Some features may be unavailable.');
    }
  }

  /**
   * Generate authentication headers for API requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-Secret-Key': this.config.secretKey,
      'X-Client-Id': 'quilox-mobile-app',
    };
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      logger.debug(`Globus API Request: ${options.method || 'GET'} ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        logger.error('Globus API Error:', data);
        throw new Error(data.message || data.error || 'API request failed');
      }

      logger.debug('Globus API Response:', data);
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      logger.error('Globus API Request Failed:', error);
      throw error;
    }
  }

  /**
   * Create a new virtual account for a user
   */
  async createVirtualAccount(
    request: CreateAccountRequest
  ): Promise<CreateAccountResponse> {
    try {
      logger.info('Creating virtual account for user:', request.userId);

      const response = await this.request<CreateAccountResponse>('/accounts/create', {
        method: 'POST',
        body: JSON.stringify({
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email,
          phone: request.phone,
          bvn: request.bvn || '',
          accountType: 'virtual',
          currency: 'NGN',
          metadata: {
            userId: request.userId,
            source: 'quilox-prive',
            createdVia: 'mobile-app',
          },
        }),
      });

      if (response.success) {
        logger.info('Virtual account created successfully:', response.data?.accountNumber);
      }

      return response;
    } catch (error: any) {
      logger.error('Failed to create virtual account:', error);
      return {
        success: false,
        error: error.message || 'Failed to create virtual account',
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance(accountNumber: string): Promise<BalanceResponse> {
    try {
      logger.debug('Fetching balance for account:', accountNumber);

      const response = await this.request<BalanceResponse>(
        `/accounts/${accountNumber}/balance`,
        { method: 'GET' }
      );

      return response;
    } catch (error: any) {
      logger.error('Failed to fetch balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch balance',
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    accountNumber: string,
    page: number = 1,
    limit: number = 50
  ): Promise<TransactionHistoryResponse> {
    try {
      logger.debug('Fetching transaction history:', { accountNumber, page, limit });

      const response = await this.request<TransactionHistoryResponse>(
        `/accounts/${accountNumber}/transactions?page=${page}&limit=${limit}`,
        { method: 'GET' }
      );

      return response;
    } catch (error: any) {
      logger.error('Failed to fetch transaction history:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch transactions',
      };
    }
  }

  /**
   * Transfer funds to another account
   */
  async transferFunds(request: TransferRequest): Promise<TransferResponse> {
    try {
      logger.info('Initiating transfer:', {
        amount: request.amount,
        from: request.sourceAccount,
        to: request.destinationAccount,
      });

      const response = await this.request<TransferResponse>('/transfers/initiate', {
        method: 'POST',
        body: JSON.stringify({
          sourceAccount: request.sourceAccount,
          destinationAccount: request.destinationAccount,
          destinationBankCode: request.destinationBankCode,
          amount: request.amount,
          currency: 'NGN',
          narration: request.narration,
          reference: request.reference || `QX${Date.now()}`,
        }),
      });

      if (response.success) {
        logger.info('Transfer initiated successfully:', response.data?.reference);
      }

      return response;
    } catch (error: any) {
      logger.error('Failed to initiate transfer:', error);
      return {
        success: false,
        error: error.message || 'Failed to initiate transfer',
      };
    }
  }

  /**
   * Verify account number and get account name
   */
  async verifyAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<{ success: boolean; accountName?: string; error?: string }> {
    try {
      logger.debug('Verifying account:', { accountNumber, bankCode });

      const response = await this.request<any>('/accounts/verify', {
        method: 'POST',
        body: JSON.stringify({
          accountNumber,
          bankCode,
        }),
      });

      return {
        success: response.success,
        accountName: response.data?.accountName,
      };
    } catch (error: any) {
      logger.error('Failed to verify account:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify account',
      };
    }
  }

  /**
   * Get list of supported banks
   */
  async getBankList(): Promise<{ success: boolean; banks?: Array<{ name: string; code: string }>; error?: string }> {
    try {
      const response = await this.request<any>('/banks', { method: 'GET' });

      return {
        success: response.success,
        banks: response.data?.banks || [],
      };
    } catch (error: any) {
      logger.error('Failed to fetch bank list:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch banks',
      };
    }
  }
}

// Export singleton instance
export const globusBankClient = new GlobusBankClient();

// Export utility functions
export const GlobusBankUtils = {
  /**
   * Format amount in Naira
   */
  formatAmount(amount: number): string {
    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },

  /**
   * Validate account number format (Nigerian banks use 10 digits)
   */
  isValidAccountNumber(accountNumber: string): boolean {
    return /^\d{10}$/.test(accountNumber);
  },

  /**
   * Generate unique transaction reference
   */
  generateReference(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `QLXPV${timestamp}${random}`;
  },
};
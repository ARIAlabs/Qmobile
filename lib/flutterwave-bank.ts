/**
 * Flutterwave API Client
 * Handles Privé wallet operations including virtual accounts, balance management, and transactions
 * 
 * API Documentation: https://developer.flutterwave.com/docs
 * Base URL: https://api.flutterwave.com/v3
 */

import { config } from '@/config/environment';

// ==================== TYPES & INTERFACES ====================

export interface FlutterwaveConfig {
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

export interface VirtualAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
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

class FlutterwaveClient {
  private config: FlutterwaveConfig;
  private timeout = 30000; // 30 seconds

  constructor() {
    // Load from environment variables
    const publicKey = process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '';
    const secretKey = process.env.EXPO_PUBLIC_FLUTTERWAVE_SECRET_KEY || '';
    const encryptionKey = process.env.EXPO_PUBLIC_FLUTTERWAVE_ENCRYPTION_KEY || '';
    
    // Debug logging
    console.debug('🔑 Flutterwave Config Loading:');
    console.debug('  Public Key:', publicKey ? `${publicKey.substring(0, 20)}...` : 'MISSING');
    console.debug('  Secret Key:', secretKey ? `${secretKey.substring(0, 20)}...` : 'MISSING');
    console.debug('  Encryption Key:', encryptionKey ? `${encryptionKey.substring(0, 20)}...` : 'MISSING');
    
    this.config = {
      publicKey,
      secretKey,
      encryptionKey,
      baseUrl: 'https://api.flutterwave.com/v3',
      environment: config.isProduction ? 'production' : 'sandbox',
    };

    if (!secretKey) {
      console.warn('Flutterwave credentials not configured. Wallet features may be unavailable.');
    }
  }

  /**
   * Generate authentication headers for API requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.secretKey}`,
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
      console.debug(`Flutterwave API Request: ${options.method || 'GET'} ${url}`);

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

      if (!response.ok || data.status === 'failed') {
        console.error('Flutterwave API Error:', data);
        throw new Error(data.message || data.error?.message || 'API request failed');
      }

      console.debug('Flutterwave API Response:', data);
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      console.error('Flutterwave API Request Failed:', error);
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
      console.info('Creating virtual account for user:', request.userId);

      const response = await this.request<any>('/virtual-account-numbers', {
        method: 'POST',
        body: JSON.stringify({
          email: request.email,
          is_permanent: true,
          bvn: request.bvn || '',
          tx_ref: `quilox-${request.userId}-${Date.now()}`,
          firstname: request.firstName,
          lastname: request.lastName,
          phonenumber: request.phone || '',
          narration: `Quilox Privé - ${request.firstName} ${request.lastName}`,
        }),
      });

      // Flutterwave uses 'status' not 'success'
      const isSuccess = response.status === 'success';
      
      if (isSuccess && response.data) {
        console.info('Virtual account created successfully:', response.data.account_number);
        
        return {
          success: true,
          data: {
            accountNumber: response.data.account_number,
            accountName: `${request.firstName} ${request.lastName}`,
            bankName: response.data.bank_name,
            bankCode: response.data.bank_code || '000',
            reference: response.data.flw_ref || response.data.order_ref,
          },
        };
      }

      // If response doesn't have expected format, return error
      throw new Error(response.message || 'Invalid response from Flutterwave');
    } catch (error: any) {
      console.error('Failed to create virtual account:', error);
      return {
        success: false,
        error: error.message || 'Failed to create virtual account',
      };
    }
  }

  /**
   * Initialize payment and get payment link
   */
  async initiatePayment(payload: {
    tx_ref: string;
    amount: number;
    currency: string;
    redirect_url: string;
    customer: {
      email: string;
      name: string;
      phonenumber?: string;
    };
    customizations?: {
      title?: string;
      description?: string;
      logo?: string;
    };
    payment_options?: string;
  }): Promise<{
    success: boolean;
    paymentLink?: string;
    error?: string;
  }> {
    try {
      console.info('Initiating Flutterwave payment:', payload.tx_ref);

      const response = await this.request<any>('/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const isSuccess = response.status === 'success';
      
      if (isSuccess && response.data?.link) {
        console.info('Payment link generated:', response.data.link);
        return {
          success: true,
          paymentLink: response.data.link,
        };
      }

      throw new Error(response.message || 'Failed to generate payment link');
    } catch (error: any) {
      console.error('Failed to initiate payment:', error);
      return {
        success: false,
        error: error.message || 'Failed to initiate payment',
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance(accountNumber: string): Promise<BalanceResponse> {
    try {
      console.debug('Fetching balance for account:', accountNumber);

      const response = await this.request<BalanceResponse>(
        `/accounts/${accountNumber}/balance`,
        { method: 'GET' }
      );

      return response;
    } catch (error: any) {
      console.error('Failed to fetch balance:', error);
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
      console.debug('Fetching transaction history:', { accountNumber, page, limit });

      const response = await this.request<TransactionHistoryResponse>(
        `/accounts/${accountNumber}/transactions?page=${page}&limit=${limit}`,
        { method: 'GET' }
      );

      return response;
    } catch (error: any) {
      console.error('Failed to fetch transaction history:', error);
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
      console.info('Initiating transfer:', {
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
        console.info('Transfer initiated successfully:', response.data?.reference);
      }

      return response;
    } catch (error: any) {
      console.error('Failed to initiate transfer:', error);
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
      console.debug('Verifying account:', { accountNumber, bankCode });

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
      console.error('Failed to verify account:', error);
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
      // Flutterwave requires country code in URL - using NG for Nigeria
      const response = await this.request<any>('/banks/NG', { method: 'GET' });

      return {
        success: response.status === 'success',
        banks: response.data || [],
      };
    } catch (error: any) {
      console.error('Failed to fetch bank list:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch banks',
      };
    }
  }
}

// Export singleton instance
export const flutterwaveClient = new FlutterwaveClient();

// Export utility functions
export const FlutterwaveUtils = {
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
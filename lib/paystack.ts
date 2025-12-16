import { config } from '@/config/environment';

export interface PaystackConfig {
  secretKey: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

class PaystackClient {
  private config: PaystackConfig;
  private timeout = 30000;

  constructor() {
    const secretKey = process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY || '';

    this.config = {
      secretKey,
      baseUrl: 'https://api.paystack.co',
      environment: config.isProduction ? 'production' : 'sandbox',
    };

    if (!secretKey) {
      console.warn('Paystack credentials not configured. Payment features may be unavailable.');
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.secretKey}`,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
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

      if (!response.ok || data.status !== true) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  async initializeTransaction(payload: {
    reference: string;
    amount: number; // NGN
    currency?: 'NGN';
    email: string;
    callback_url: string;
    channels?: Array<'card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer'>;
    metadata?: any;
  }): Promise<{ success: boolean; paymentLink?: string; reference?: string; error?: string }> {
    try {
      const response = await this.request<any>('/transaction/initialize', {
        method: 'POST',
        body: JSON.stringify({
          reference: payload.reference,
          amount: Math.round(payload.amount * 100),
          currency: payload.currency || 'NGN',
          email: payload.email,
          callback_url: payload.callback_url,
          channels: payload.channels,
          metadata: payload.metadata,
        }),
      });

      return {
        success: true,
        paymentLink: response.data?.authorization_url,
        reference: response.data?.reference,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initialize transaction',
      };
    }
  }

  async verifyTransaction(reference: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.request<any>(`/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to verify transaction',
      };
    }
  }

  private async createOrFetchCustomer(payload: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  }): Promise<{ success: boolean; customerCode?: string; error?: string }> {
    try {
      const response = await this.request<any>('/customer', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        customerCode: response.data?.customer_code,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create customer',
      };
    }
  }

  async createDedicatedAccount(payload: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{
    success: boolean;
    data?: {
      accountNumber: string;
      accountName: string;
      bankName: string;
      bankCode: string;
      reference: string;
    };
    error?: string;
  }> {
    try {
      const customer = await this.createOrFetchCustomer({
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        phone: payload.phone,
      });

      if (!customer.success || !customer.customerCode) {
        throw new Error(customer.error || 'Customer creation failed');
      }

      const response = await this.request<any>('/dedicated_account', {
        method: 'POST',
        body: JSON.stringify({
          customer: customer.customerCode,
          preferred_bank: 'wema-bank',
        }),
      });

      const acct = response.data;
      return {
        success: true,
        data: {
          accountNumber: acct.account_number,
          accountName: acct.account_name,
          bankName: acct.bank?.name || '',
          bankCode: acct.bank?.id ? String(acct.bank.id) : '',
          reference: acct.dedicated_account_id ? String(acct.dedicated_account_id) : `paystack-${payload.userId}`,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create dedicated account',
      };
    }
  }
}

export const paystackClient = new PaystackClient();

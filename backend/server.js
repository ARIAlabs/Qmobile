const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for server-side operations
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Middleware
app.use(cors());

// Capture raw body for Paystack webhook signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Quilox Globus Bank Proxy',
    timestamp: new Date().toISOString() 
  });
});

// Helper function to make Globus API requests
const callGlobusAPI = async (endpoint, method = 'GET', body = null) => {
  const baseUrl = process.env.GLOBUS_BASE_URL || 'https://sandbox.globusbank.com/api/v1';
  const url = `${baseUrl}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GLOBUS_API_KEY}`,
      'X-Secret-Key': process.env.GLOBUS_SECRET_KEY,
      'X-Client-Id': 'quilox-mobile-app'
    }
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Globus API request failed');
  }
  
  return data;
};

// Create Virtual Account
app.post('/api/wallet/create', async (req, res) => {
  try {
    console.log('Creating virtual account:', req.body);
    const data = await callGlobusAPI('/accounts/create', 'POST', req.body);
    res.json(data);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get Account Balance
app.get('/api/wallet/balance/:accountNumber', async (req, res) => {
  try {
    const { accountNumber } = req.params;
    console.log('Fetching balance for:', accountNumber);
    const data = await callGlobusAPI(`/accounts/${accountNumber}/balance`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get Transaction History
app.get('/api/wallet/transactions/:accountNumber', async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { page = 1, limit = 50 } = req.query;
    console.log('Fetching transactions for:', accountNumber);
    const data = await callGlobusAPI(`/accounts/${accountNumber}/transactions?page=${page}&limit=${limit}`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Transfer Funds
app.post('/api/wallet/transfer', async (req, res) => {
  try {
    console.log('Initiating transfer:', req.body);
    const data = await callGlobusAPI('/transfers/initiate', 'POST', req.body);
    res.json(data);
  } catch (error) {
    console.error('Error initiating transfer:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Verify Account
app.post('/api/wallet/verify', async (req, res) => {
  try {
    console.log('Verifying account:', req.body);
    const data = await callGlobusAPI('/accounts/verify', 'POST', req.body);
    res.json(data);
  } catch (error) {
    console.error('Error verifying account:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get Bank List
app.get('/api/banks', async (req, res) => {
  try {
    const data = await callGlobusAPI('/banks');
    res.json(data);
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Paystack Webhook Handler
app.post('/api/webhooks/paystack', async (req, res) => {
  try {
    console.log('🔔 Paystack webhook received:', JSON.stringify(req.body, null, 2));

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers['x-paystack-signature'];

    if (!paystackSecret) {
      console.error('❌ PAYSTACK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Paystack not configured' });
    }

    if (!signature || !req.rawBody) {
      console.error('⚠️ Missing webhook signature or raw body');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const expected = crypto
      .createHmac('sha512', paystackSecret)
      .update(req.rawBody)
      .digest('hex');

    if (signature !== expected) {
      console.error('⚠️ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if Supabase is initialized
    if (!supabase) {
      console.error('❌ Supabase not initialized');
      return res.status(500).json({ error: 'Database not configured' });
    }

    const payload = req.body;

    // Only process successful charge.success events
    if (payload.event === 'charge.success' && payload.data?.status === 'success') {
      const txRef = payload.data.reference;
      const amount = typeof payload.data.amount === 'number' ? payload.data.amount / 100 : 0;

      console.log(`✅ Webhook received: ${txRef}, Amount: ₦${amount}`);
      
      // DISABLED: Client handles all balance updates to prevent double-counting
      // Webhook just acknowledges - no database changes
      res.json({ 
        success: true, 
        message: 'Webhook acknowledged',
        transaction_ref: txRef
      });
    } else {
      console.log(`ℹ️ Webhook event ignored: ${payload.event} - ${payload.data?.status}`);
      res.json({ success: true, message: 'Event acknowledged' });
    }
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Export for Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Globus Bank Proxy Server running on port ${PORT}`);
  });
}
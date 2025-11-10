const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Export for Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Globus Bank Proxy Server running on port ${PORT}`);
  });
}
const express = require('express');
const app = express();

app.use(express.json());

// Proxy endpoint for Globus Bank
app.post('/api/wallet/create', async (req, res) => {
  try {
    const response = await fetch('https://sandbox.globusbank.com/api/v1/accounts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLOBUS_API_KEY}`,
        'X-Secret-Key': process.env.GLOBUS_SECRET_KEY
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
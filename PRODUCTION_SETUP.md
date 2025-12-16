# 🚀 Production Setup - Live Flutterwave Payments

## Quick Start: Switch to Live Payments

Your payment integration is ready! Follow these steps to accept real payments.

---

## 1️⃣ Get Live Flutterwave Credentials

### Login to Flutterwave Dashboard
1. Go to https://dashboard.flutterwave.com
2. Complete KYC verification (if not done)
3. Navigate to **Settings → API Keys**
4. Switch from **Test Mode** to **Live Mode** toggle

### Copy Your Live Keys
```
Public Key:     FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
Secret Key:     FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
Encryption Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **CRITICAL**: Never commit these to Git. Store them as environment variables only.

---

## 2️⃣ Update Environment Variables

### Option A: Local Testing (.env)
```bash
# Replace TEST keys with LIVE keys
EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your-live-key-here
EXPO_PUBLIC_FLUTTERWAVE_SECRET_KEY=FLWSECK-your-live-key-here
EXPO_PUBLIC_FLUTTERWAVE_ENCRYPTION_KEY=your-encryption-key-here

# Set to production mode
EXPO_PUBLIC_ENVIRONMENT=production
```

### Option B: Production Deployment

**For Expo EAS Build:**
```bash
# Add secrets to your project
eas secret:create --scope project --name EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY --value "FLWPUBK-..."
eas secret:create --scope project --name EXPO_PUBLIC_FLUTTERWAVE_SECRET_KEY --value "FLWSECK-..."
eas secret:create --scope project --name EXPO_PUBLIC_FLUTTERWAVE_ENCRYPTION_KEY --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_ENVIRONMENT --value "production"
```

**For Vercel/Netlify/Other Platforms:**
Add these in your platform's environment variables dashboard:
- `EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`
- `EXPO_PUBLIC_FLUTTERWAVE_SECRET_KEY`
- `EXPO_PUBLIC_FLUTTERWAVE_ENCRYPTION_KEY`
- `EXPO_PUBLIC_ENVIRONMENT=production`

---

## 3️⃣ Configure Production Webhooks

### Set Webhook URL in Flutterwave
1. Dashboard → **Settings → Webhooks**
2. Add webhook URL: `https://your-domain.com/api/flutterwave-webhook`
3. Copy the **Webhook Secret Hash**
4. Add to environment:
   ```bash
   FLUTTERWAVE_WEBHOOK_SECRET=your-webhook-secret
   ```

### Verify Your Webhook Handler
Check `backend/server.js` has signature verification:
```javascript
app.post('/api/flutterwave-webhook', async (req, res) => {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = req.headers['verif-hash'];
  
  if (signature !== secretHash) {
    return res.status(401).send('Invalid signature');
  }
  // ... process webhook
});
```

---

## 4️⃣ Run Database Migration

**IMPORTANT**: Add payment columns to your bookings table.

### Run in Supabase SQL Editor:
```sql
-- Add payment columns
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT 
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) 
  DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference 
  ON bookings(payment_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status 
  ON bookings(payment_status);

-- Update existing records
UPDATE bookings SET payment_status = 'pending' 
WHERE payment_status IS NULL;
```

Or use the provided file:
```bash
# Copy SQL from database_migration_payment.sql and run in Supabase
```

---

## 5️⃣ Test with Real Payment (Small Amount)

### Make a Test Booking
1. Start your app: `npm start`
2. Navigate to **Booking → Select Table**
3. Enter guest details
4. Click **"Proceed to Payment - ₦[amount]"**
5. Use a **real card** with small amount (e.g., ₦100)
6. Complete payment flow

### Verify Success
✅ Check booking appears in **My Bookings**
✅ Check Flutterwave Dashboard → **Transactions** (should show successful payment)
✅ Verify database:
```sql
SELECT * FROM bookings 
WHERE payment_status = 'paid' 
ORDER BY created_at DESC LIMIT 1;
```

---

## 6️⃣ Production Checklist

### Pre-Launch ✅
- [ ] Live API keys configured
- [ ] `EXPO_PUBLIC_ENVIRONMENT=production`
- [ ] Database migration completed
- [ ] Webhook URL configured in Flutterwave
- [ ] Test payment successful (small amount)
- [ ] Webhook delivery working
- [ ] HTTPS enabled on all endpoints
- [ ] Error logging configured
- [ ] Customer support process documented

### Security ✅
- [ ] API keys in environment variables (not hardcoded)
- [ ] `.env` files in `.gitignore`
- [ ] Webhook signature validation enabled
- [ ] Payment verification server-side
- [ ] Rate limiting on payment endpoints

### Monitoring ✅
- [ ] Flutterwave email alerts enabled
- [ ] Application error tracking (Sentry/similar)
- [ ] Daily payment reconciliation process
- [ ] Failed transaction monitoring

---

## 7️⃣ Understanding the Payment Flow

```
User Flow:
1. Select table → Enter details → Click "Proceed to Payment"
2. Redirected to Flutterwave payment page
3. Enter card details → Complete payment
4. Redirected back to app → Payment verified
5. Booking created with status="confirmed", payment_status="paid"

Technical Flow:
1. flutterwaveClient.initiatePayment() → Generate payment link
2. User pays → Flutterwave processes
3. Redirect to quilox://payment-callback?status=successful&transaction_id=...
4. verifyFlutterwaveTransaction() → Verify with Flutterwave API
5. createBookingWithPayment() → Save booking to database
```

---

## 8️⃣ How to Verify Production Mode

### Check Environment Detection
The app automatically detects production:
```typescript
// config/environment.ts
EXPO_PUBLIC_ENVIRONMENT=production
  ↓
config.isProduction = true
config.features.enableTestMode = false
  ↓
FlutterwaveClient uses: environment: 'production'
```

### Console Logs to Watch
When in production mode, you'll see:
```
✓ Environment: production
✓ Flutterwave mode: production
✓ Using live API endpoints
```

---

## 9️⃣ Customer Support Guide

### Common Issues & Solutions

**Payment Failed**
- Check card has sufficient funds
- Verify card is enabled for online transactions
- Check transaction in Flutterwave Dashboard

**Payment Successful but No Booking**
- Check webhook was received (Flutterwave logs)
- Verify transaction in database
- Check application error logs

**Refund Request**
1. Go to Flutterwave Dashboard → Transactions
2. Find transaction → Click Refund
3. Update booking in database:
   ```sql
   UPDATE bookings 
   SET payment_status = 'refunded', status = 'cancelled'
   WHERE payment_reference = 'BOOKING-xxx';
   ```

### Support Database Queries
```sql
-- Find customer bookings
SELECT id, guest_name, guest_email, booking_fee, 
       payment_status, payment_reference, created_at
FROM bookings
WHERE guest_email = 'customer@example.com'
ORDER BY created_at DESC;

-- Check payment status
SELECT payment_status, COUNT(*) 
FROM bookings 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY payment_status;
```

---

## 🔟 Rollback Plan

If you need to revert to test mode:

```bash
# Change environment back
EXPO_PUBLIC_ENVIRONMENT=staging

# Or swap keys back to test
EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
EXPO_PUBLIC_FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
```

Restart the app to apply changes.

---

## 📞 Support Resources

### Flutterwave Support
- **Email**: developers@flutterwavego.com
- **Phone**: +234 1 888 3666
- **Docs**: https://developer.flutterwave.com
- **Status**: https://status.flutterwave.com

### Debug Transaction
```bash
# Verify any transaction
curl -X GET "https://api.flutterwave.com/v3/transactions/{id}/verify" \
  -H "Authorization: Bearer YOUR_SECRET_KEY"
```

---

## 🎉 You're Ready When...

✅ **Test button removed from profile** (DONE)
✅ Live API keys configured
✅ Database migration run
✅ Webhook URL set
✅ Test payment successful
✅ Environment = production

**Your Integration Status:**
- ✅ Payment UI: Complete
- ✅ Verification: Server-side
- ✅ Security: Production-ready
- ✅ Error handling: Implemented

---

## 🚦 Launch!

Once all checklist items are complete:

```bash
# Build for production
npm run build

# Or deploy with EAS
eas build --platform all --profile production
```

Monitor the first few transactions closely and ensure:
- Payments are settling to your account
- Webhooks are being received
- Bookings are created successfully
- Customers receive confirmations

**Congratulations! You're accepting live payments! 🎊**

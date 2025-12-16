# Flutterwave Table Booking Payment - Setup & Testing Guide

## ✅ Completed Integration
- ✓ Updated Booking interface with payment fields
- ✓ Added payment verification functions
- ✓ Modified booking-confirmation.tsx with payment flow
- ✓ Created payment-callback.tsx for redirect handling

## 📋 Setup Steps

### 1. Database Migration

Run this SQL in your Supabase SQL Editor to add payment columns to the bookings table:

```sql
-- Add payment columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index for faster payment reference lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference ON bookings(payment_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Update existing bookings to have default payment status
UPDATE bookings
SET payment_status = 'pending'
WHERE payment_status IS NULL;
```

### 2. Environment Variables

Verify these are set in your `.env` file:

```bash
EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxx
EXPO_PUBLIC_FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxx
EXPO_PUBLIC_FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxxxxxxxxxxxxxx
```

### 3. Deep Link Configuration (app.json)

Add the deep link scheme for payment callbacks:

```json
{
  "expo": {
    "scheme": "quilox",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "quilox"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "bundleIdentifier": "com.quilox.app",
      "associatedDomains": ["applinks:quilox.com"]
    }
  }
}
```

## 🧪 Testing Instructions

### Test Cards (Flutterwave Sandbox)

Use these test cards for different scenarios:

#### Successful Payment:
- **Card Number**: 5531 8866 5214 2950
- **CVV**: 564
- **Expiry**: 09/32
- **PIN**: 3310
- **OTP**: 12345

#### Insufficient Funds:
- **Card Number**: 5840 4000 0000 0001
- **CVV**: 123
- **Expiry**: 12/25
- **PIN**: 1234

#### Failed Transaction:
- **Card Number**: 5840 4000 0000 0003
- **CVV**: 123
- **Expiry**: 12/25
- **PIN**: 1234

### Testing Flow

#### Step 1: Start the App
```bash
npm start
# or
expo start
```

#### Step 2: Navigate to Booking
1. Go to the Booking tab
2. Select a date
3. Choose number of guests
4. Select a table

#### Step 3: Fill Guest Details
1. Enter full name (e.g., "Test User")
2. Enter email (e.g., "test@quilox.com")
3. Enter phone (e.g., "+234 801 234 5678")
4. Add special requests (optional)

#### Step 4: Initiate Payment
1. Click "Proceed to Payment - ₦[amount]"
2. Verify you see the Flutterwave payment page
3. Check the payment details are correct

#### Step 5: Complete Payment
1. Enter test card details
2. Enter PIN when prompted
3. Enter OTP (12345)
4. Wait for payment confirmation

#### Step 6: Verify Booking Creation
1. Should redirect back to app
2. Should see "Payment Successful" message
3. Check booking-history page for new booking
4. Verify booking status is "confirmed"
5. Verify payment_status is "paid"

## 🔍 Verification Checklist

### Database Verification
```sql
-- Check the latest booking
SELECT 
  id,
  guest_name,
  booking_fee,
  status,
  payment_reference,
  payment_status,
  metadata,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;
```

### Expected Results:
- ✓ `status` should be "confirmed"
- ✓ `payment_reference` should contain transaction ref (e.g., "BOOKING-1733429...")
- ✓ `payment_status` should be "paid"
- ✓ `metadata` should contain Flutterwave transaction details

### Console Logs to Check:
```
Initiating payment: { amount: 10000, txRef: 'BOOKING-...', email: '...' }
Payment link generated: https://ravemodal-dev.herokuapp.com/...
Deep link received: quilox://payment-callback?status=successful&transaction_id=...
Verifying payment: [transaction_id]
Payment verification successful: BOOKING-...
Booking created successfully with payment: [booking_id]
```

## 🐛 Troubleshooting

### Issue: Payment link doesn't open
**Solution**: Check that expo-web-browser is installed
```bash
npx expo install expo-web-browser
```

### Issue: Deep link doesn't redirect back
**Solution**: 
- Verify `scheme: "quilox"` is in app.json
- Rebuild the app after adding scheme
- For iOS, run: `npx pod-install`

### Issue: Payment verification fails
**Solution**: 
- Check FLUTTERWAVE_SECRET_KEY is correct
- Verify API key has proper permissions
- Check network connectivity

### Issue: Booking not created after payment
**Solution**:
- Check console for errors
- Verify table is still available
- Check database permissions

## 📊 Test Scenarios

### Scenario 1: Successful Booking
1. Complete full booking flow
2. Use successful test card
3. Verify booking appears with "confirmed" status

### Scenario 2: Payment Failure
1. Start booking flow
2. Use failed test card
3. Verify booking is NOT created
4. User should see error message

### Scenario 3: Insufficient Funds
1. Start booking flow
2. Use insufficient funds card
3. Verify appropriate error message
4. User can retry payment

### Scenario 4: Table Unavailability
1. Book a table successfully
2. Try to book the same table/date again
3. Should see "Table not available" even if payment succeeds

## 🚀 Production Checklist

Before going live:

- [ ] Replace sandbox keys with production keys
- [ ] Test with real payment card (small amount)
- [ ] Set up Flutterwave webhook URL
- [ ] Configure proper redirect URLs (not localhost)
- [ ] Test on both iOS and Android devices
- [ ] Verify email confirmations are sent
- [ ] Test refund flow (if applicable)
- [ ] Add proper error tracking (Sentry, etc.)
- [ ] Set up payment reconciliation process
- [ ] Document customer support procedures

## 📝 Key Files Modified

- `lib/supabase.ts` - Added payment functions
- `app/booking-confirmation.tsx` - Integrated payment flow
- `app/payment-callback.tsx` - NEW - Handles redirects
- Database - Added payment columns to bookings table

## 🔗 Resources

- [Flutterwave Test Cards](https://developer.flutterwave.com/docs/integration-guides/testing-helpers)
- [Flutterwave API Docs](https://developer.flutterwave.com/reference/introduction-1)
- [Expo Deep Linking](https://docs.expo.dev/guides/linking/)

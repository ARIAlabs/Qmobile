I'll create comprehensive API documentation for your Quilox mobile app. Let me first check the supabase file to document all functions:

Now I'll create comprehensive API documentation:

I'll provide you with the complete API documentation. Create a new file `API_DOCUMENTATION.md` in your project root with this content:

```markdown
# Quilox Mobile App - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Database Schema](#database-schema)
4. [API Functions](#api-functions)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Usage Examples](#usage-examples)

---

## Overview

The Quilox mobile app uses **Supabase** as its backend-as-a-service platform, providing:
- PostgreSQL database
- Real-time subscriptions
- Authentication
- Storage for images
- Row Level Security (RLS)

**Base URL**: `https://ucfnieiloumpxgfhhjip.supabase.co`

**Tech Stack**:
- React Native + Expo
- Supabase Client Library
- TypeScript
- AsyncStorage (native) / localStorage (web)

---

## Authentication

### Configuration

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ucfnieiloumpxgfhhjip.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // or undefined for web
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Authentication Methods

- **Anonymous Access**: Most read operations use anonymous access
- **Authenticated Users**: Required for creating bookings with user_id
- **Admin Access**: Required for creating/updating content

---

## Database Schema

### Tables

#### 1. `mobile_carousel`
Stores carousel items for the home screen.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `image_url` | TEXT | URL to carousel image |
| `title` | TEXT | Carousel item title |
| `subtitle` | TEXT | Carousel item subtitle |
| `display_order` | INTEGER | Display order (ascending) |
| `is_active` | BOOLEAN | Whether item is active |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**RLS Policies**:
- Read: Public (where `is_active = true`)
- Write: Authenticated admins only

---

#### 2. `merch_products`
Stores merchandise products for the shop.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Product name |
| `description` | TEXT | Product description |
| `price` | NUMERIC | Current price (Naira) |
| `old_price` | NUMERIC | Original price for discounts |
| `category` | TEXT | 'Apparel', 'Accessories', 'Collectibles' |
| `rating` | NUMERIC | Average rating (0-5) |
| `reviews_count` | INTEGER | Number of reviews |
| `image_url` | TEXT | Product image URL |
| `stock_quantity` | INTEGER | Available stock |
| `is_available` | BOOLEAN | Product availability |
| `is_exclusive` | BOOLEAN | Exclusive item flag |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**RLS Policies**:
- Read: Public (where `is_available = true`)
- Write: Authenticated admins only

**Constraints**:
- `category` must be one of: 'Apparel', 'Accessories', 'Collectibles'

---

#### 3. `fees_posts`
Stores social feed posts/announcements.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT | Post title |
| `description` | TEXT | Post caption/description |
| `image_url` | TEXT | Post image (storage path or URL) |
| `post_type` | TEXT | 'announcement', 'event', etc. |
| `amount` | NUMERIC | Associated amount (optional) |
| `is_active` | BOOLEAN | Whether post is active |
| `user_id` | UUID | Creator user ID |
| `likes_count` | INTEGER | Number of likes |
| `comments_count` | INTEGER | Number of comments |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**RLS Policies**:
- Read: Public (where `is_active = true`)
- Write: Authenticated users

---

#### 4. `table_areas`
Stores table/seating areas for bookings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Table area name |
| `table_number` | TEXT | Table identifier |
| `section` | TEXT | 'VIP', 'Regular', 'Privé' |
| `seats` | INTEGER | Seating capacity |
| `booking_fee` | NUMERIC | Booking fee (Naira) |
| `image_url` | TEXT | Table area image |
| `is_available` | BOOLEAN | Availability status |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**RLS Policies**:
- Read: Public
- Write: Authenticated admins only

**Constraints**:
- `section` must be one of: 'VIP', 'Regular', 'Privé'

---

#### 5. `bookings`
Stores table booking records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User ID (nullable for guests) |
| `table_id` | UUID | Foreign key to table_areas |
| `booking_date` | DATE | Reservation date |
| `guest_count` | INTEGER | Number of guests |
| `guest_name` | TEXT | Guest name |
| `guest_email` | TEXT | Guest email |
| `guest_phone` | TEXT | Guest phone |
| `special_requests` | TEXT | Special requests |
| `status` | TEXT | 'pending', 'confirmed', 'cancelled', 'completed' |
| `booking_fee` | NUMERIC | Booking fee amount |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**RLS Policies**:
- Read: Public (own bookings) or Admin
- Write: Authenticated users

**Foreign Keys**:
- `table_id` → `table_areas.id`
- `user_id` → `auth.users.id` (nullable)

**Constraints**:
- `status` must be one of: 'pending', 'confirmed', 'cancelled', 'completed'

---

## API Functions

### Carousel Functions

#### [fetchCarousel()](cci:1://file:///c:/Users/VaultHill/Documents/qmobile/lib/supabase.ts:98:0-113:2)
Fetches all active carousel items sorted by display order.

**Returns**: `Promise<CarouselItem[]>`

**Example**:
```typescript
const items = await fetchCarousel();
// Returns: [{ id: '...', image_url: '...', title: '...', ... }]
```

**Query**:
```sql
SELECT * FROM mobile_carousel 
WHERE is_active = true 
ORDER BY display_order ASC;
```

**Error Handling**: Returns empty array `[]` on error.

---

#### [subscribeToCarousel(callback)](cci:1://file:///c:/Users/VaultHill/Documents/qmobile/lib/supabase.ts:115:0-140:2)
Subscribes to real-time carousel changes.

**Parameters**:
- `callback: (payload: any) => void` - Function called on changes

**Returns**: `() => void` - Unsubscribe function

**Example**:
```typescript
const unsubscribe = subscribeToCarousel((payload) => {
  console.log('Carousel updated:', payload);
  // Refresh carousel data
});

// Later, cleanup
unsubscribe();
```

**Events**: Listens to INSERT, UPDATE, DELETE on `mobile_carousel`

---

### Merchandise Functions

#### [fetchMerchProducts()](cci:1://file:///c:/Users/VaultHill/Documents/qmobile/lib/supabase.ts:142:0-156:2)
Fetches all available merchandise products.

**Returns**: `Promise<MerchProduct[]>`

**Example**:
```typescript
const products = await fetchMerchProducts();
// Returns: [{ id: '...', name: 'Black Hoodie', price: 120000, ... }]
```

**Query**:
```sql
SELECT * FROM merch_products 
WHERE is_available = true;
```

**Error Handling**: Returns empty array `[]` on error.

---

### Feed Functions

#### [fetchFeedPosts()](cci:1://file:///c:/Users/VaultHill/Documents/qmobile/lib/supabase.ts:172:0-212:2)
Fetches all active feed posts, most recent first.

**Returns**: `Promise<FeedPost[]>`

**Example**:
```typescript
const posts = await fetchFeedPosts();
// Returns: [{ id: '...', title: '...', caption: '...', image_url: '...', ... }]
```

**Query**:
```sql
SELECT * FROM fees_posts 
WHERE is_active = true 
ORDER BY created_at DESC;
```

**Data Transformation**:
1. Converts storage paths to public URLs
2. Cleans auto-generated prefixes from captions
3. Sets default values for `likes_count` and `comments_count`

---

### Booking Functions

#### [fetchTableAreas()](cci:1://file:///c:/Users/VaultHill/Documents/qmobile/lib/supabase.ts:266:0-295:2)
Fetches all available table areas.

**Returns**: `Promise<TableArea[]>`

**Example**:
```typescript
const tables = await fetchTableAreas();
// Returns: [{ id: '...', name: 'COA 1', section: 'VIP', seats: 8, ... }]
```

**Query**:
```sql
SELECT * FROM table_areas 
ORDER BY section ASC, table_number ASC;
```

**Fallback**: Returns mock data if database not available.

---

#### [checkTableAvailability(tableId, bookingDate)](cci:1://file:///c:/Users/VaultHill/Documents/qmobile/lib/supabase.ts:297:0-318:2)
Checks if a table is available for a specific date.

**Parameters**:
- `tableId: string` - Table UUID
- `bookingDate: string` - Date in format 'YYYY-MM-DD'

**Returns**: `Promise<boolean>` - `true` if available, `false` if booked

**Example**:
```typescript
const isAvailable = await checkTableAvailability(
  'table-uuid',
  '2025-11-15'
);
// Returns: true or false
```

**Query**:
```sql
SELECT id FROM bookings 
WHERE table_id = $1 
  AND booking_date = $2 
  AND status IN ('pending', 'confirmed');
```

**Logic**: Table is available if no active bookings exist.

---

#### [createBooking(bookingData)](cci:1://file:///c:/Users/VaultHill/Documents/qmobile/lib/supabase.ts:320:0-360:2)
Creates a new table booking.

**Parameters**:
- `bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>`

**Returns**: `Promise<{ success: boolean; booking?: Booking; error?: string }>`

**Example**:
```typescript
const result = await createBooking({
  user_id: null, // or user UUID
  table_id: 'table-uuid',
  booking_date: '2025-11-15',
  guest_count: 4,
  guest_name: 'John Doe',
  guest_email: 'john@example.com',
  guest_phone: '+234901234567',
  special_requests: 'Birthday celebration',
  status: 'pending',
  booking_fee: 50000,
});

if (result.success) {
  console.log('Booking created:', result.booking);
} else {
  console.error('Error:', result.error);
}
```

**Process**:
1. Check table availability
2. If available, insert booking record
3. Return success/error response

---

#### [fetchUserBookings(userId?)](cci:1://file:///c:/Users/VaultHill/Documents/qmobile/lib/supabase.ts:362:0-388:2)
Fetches bookings for a specific user or all bookings.

**Parameters**:
- `userId?: string` - Optional user UUID filter

**Returns**: `Promise<BookingWithTable[]>`

**Example**:
```typescript
// Get all bookings
const allBookings = await fetchUserBookings();

// Get user's bookings
const myBookings = await fetchUserBookings('user-uuid');
// Returns: [{ ...booking, table: { ...tableArea } }]
```

**Join**: Includes full table area details in response.

---

#### [cancelBooking(bookingId)](cci:1://file:///c:/Users/VaultHill/Documents/qmobile/lib/supabase.ts:390:0-410:2)
Cancels a booking by setting status to 'cancelled'.

**Parameters**:
- `bookingId: string` - Booking UUID

**Returns**: `Promise<{ success: boolean; error?: string }>`

**Example**:
```typescript
const result = await cancelBooking('booking-uuid');

if (result.success) {
  console.log('Booking cancelled');
} else {
  console.error('Error:', result.error);
}
```

---

## Usage Examples

### Complete Booking Flow

```typescript
import { useState } from 'react';
import { 
  fetchTableAreas, 
  checkTableAvailability, 
  createBooking 
} from '@/lib/supabase';

function BookingScreen() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [date, setDate] = useState('2025-11-15');

  const handleBooking = async () => {
    // 1. Check availability
    const isAvailable = await checkTableAvailability(
      selectedTable.id,
      date
    );

    if (!isAvailable) {
      alert('Table not available for this date');
      return;
    }

    // 2. Create booking
    const result = await createBooking({
      user_id: null,
      table_id: selectedTable.id,
      booking_date: date,
      guest_count: 4,
      guest_name: 'John Doe',
      guest_email: 'john@example.com',
      guest_phone: '+234901234567',
      special_requests: 'Window seat',
      status: 'pending',
      booking_fee: selectedTable.booking_fee,
    });

    if (result.success) {
      alert('Booking confirmed!');
    } else {
      alert(`Error: ${result.error}`);
    }
  };
}
```

---

## Best Practices

### 1. Data Fetching
- Use `useEffect` for initial data load
- Show loading states while fetching
- Handle errors gracefully
- Implement pull-to-refresh

### 2. State Management
- Use React Context for global state
- Keep component state minimal
- Avoid prop drilling

### 3. Error Handling
- Always handle promise rejections
- Log errors for debugging
- Show user-friendly messages
- Provide fallback UI

### 4. Performance
- Use `Promise.all()` for parallel requests
- Cache data when appropriate
- Implement pagination for large lists
- Optimize images

### 5. Security
- Never expose service_role key
- Use RLS policies for access control
- Validate user input
- Sanitize external data

---

## Rate Limits & Quotas

**Supabase Free Tier**:
- 500MB database storage
- 1GB file storage
- 2GB bandwidth/month
- 50,000 monthly active users
- Unlimited API requests

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Dashboard**: https://app.supabase.com
- **React Native Docs**: https://reactnative.dev
- **Expo Docs**: https://docs.expo.dev

---

## Version History

- **v1.0.0** (2025-11-04): Initial API documentation
  - Carousel management
  - Merchandise shop
  - Feed posts
  - Table bookings
  - Real-time subscriptions
```

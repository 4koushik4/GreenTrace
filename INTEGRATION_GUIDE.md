# Integration Guide: Connect React App to Supabase Database

## 🎯 Overview

This guide explains how your EcoSort React app connects to the newly created Supabase tables.

---

## 📦 Current Integration Status

### ✅ Already Integrated

The app already has Supabase client setup. Check:

```typescript
// client/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
);
```

### Environment Variables (Already Set)

```
VITE_SUPABASE_URL=https://lmmvawkrkbxpfvkktcso.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_HweyeDjpAfFIIm7pWtiumg_mjiW-zBS
```

---

## 🚀 How Each Feature Uses the Database

### 1️⃣ Schedule Pickup (/pickup)

**File:** `client/pages/WastePickup.tsx`
**Table:** `pickups`

**How it works:**

```typescript
// Form submission creates record
const pickup = await createPickup({
  user_id: user?.id || "mock-user-1",
  name: values.name,
  email: values.email,
  phone: values.phone,
  address: values.address,
  waste_type: values.wasteType,
  pickup_date: values.pickupDate.toISOString(),
  description: values.description,
});

// Implementation in client/lib/pickups.ts
export async function createPickup(input: PickupInput): Promise<Pickup> {
  if (!supabase) {
    // Fallback: use localStorage
    const list = readLocal();
    list.unshift(item);
    writeLocal(list);
    return item;
  }

  // Primary: use Supabase
  const { data, error } = await supabase
    .from("pickups")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
```

**Data Flow:**

```
Form Submit
    ↓
Client validation (Zod)
    ↓
Check if Supabase available
    ↓
Insert to pickups table
    ↓
Auto-create user_points record (optional)
    ↓
Show success notification
```

---

### 2️⃣ Report Environmental Issue (/report)

**File:** `client/pages/ReportIssue.tsx`
**Table:** `illegal_reports`

**How it works:**

```typescript
// Form submission with photo
const newReport = {
  id: `local-${Date.now()}`,
  user_id: uid,
  title: title.trim() || undefined,
  description: desc.trim(),
  category: category, // 'illegal_dumping', 'hazardous_waste', etc.
  severity: severity, // 'low', 'medium', 'high', 'urgent'
  photo_url: photoUrl, // base64 encoded
  latitude: loc.lat,
  longitude: loc.lng,
  address: address.trim(),
  status: "new",
};

// Try localStorage first (always works)
list.unshift(newReport);
writeLocal(list);

// Try Supabase as secondary
if (supabase) {
  const { error } = await supabase.from("illegal_reports").insert(newReport);
}
```

**Status Flow:**

```
new → in_progress → resolved
              ↘ rejected
```

---

### 3️⃣ Recycling Centers (/centers, /centres)

**File:** `client/pages/RecyclingCenters.tsx`
**Table:** `recycling_centers`

**How it works:**

```typescript
// Uses OpenStreetMap API to fetch real-time data
const overpassQuery = `
  [out:json][timeout:25];
  (
    node["amenity"="recycling"](bounds);
    way["amenity"="waste_disposal"](bounds);
  );
  out center meta;
`;

// Falls back to mock data if API unavailable
const list = centers.length > 0 ? centers : mockRecyclingCenters;

// Note: OpenStreetMap data is NOT stored in Supabase
// But you can cache it:
```

**Optional: Cache Centers in Supabase**

```typescript
// Add to activity after fetch
if (supabase) {
  await supabase.from("recycling_centers").upsert(facilities);
}
```

---

### 4️⃣ Buy-Back Program (/buyback)

**File:** `client/pages/BuyBack.tsx`
**Table:** `buyback_orders`

**How it works:**

```typescript
// User selects material and weight
const quote = getPriceQuote(material, weight);
// Calculates: ₹10/kg for plastic, ₹6/kg for paper, etc.

// Submit order
const order = await createBuybackOrder({
  user_id: user?.id || "mock-user-1",
  material_type: "plastic",
  weight_kg: 5.5,
  // price_quote calculated automatically
});

// Awards points if Supabase available
if (sb && user?.id) {
  const pts = Math.max(1, Math.round(order.price_quote / 10));
  await awardPoints(user.id, pts, `Buy-back order for ${material}`);
}
```

**Database Entry:**

```sql
INSERT INTO buyback_orders (user_id, material_type, weight_kg, price_quote, status)
VALUES ('user-123', 'plastic', 5.5, 55.00, 'quote');

-- Later, when confirmed:
UPDATE buyback_orders SET status = 'confirmed' WHERE id = 'order-id';
```

---

### 5️⃣ Sell Item (/sell-item)

**File:** `client/pages/SellItem.tsx`
**Table:** `marketplace_listings`

**How it works:**

```typescript
// User fills listing form
const listing = await createListing({
  user_id: user?.id || "mock-user-1",
  title: "Dell Laptop",
  category: "electronics", // electronics, furniture, books, clothes, other
  condition: "used", // new, used, repair
  description: "Core i5, 8GB RAM, 256GB SSD",
  price: 45000,
  images: imageUrls, // base64 or external URLs
});

// Implementation
export async function createListing(input: ListingInput): Promise<Listing> {
  if (!supabase) {
    const list = read<Listing>(LS_LISTINGS);
    list.unshift(item);
    write(LS_LISTINGS, list);
    return item;
  }

  const { data, error } = await supabase
    .from("marketplace_listings")
    .insert({
      user_id: input.user_id,
      title: input.title,
      category: input.category,
      condition: input.condition,
      description: input.description,
      price: input.price,
      images: input.images,
    })
    .select("*")
    .single();
}
```

**Related Tables:**

- `marketplace_listings` - The item listing
- `marketplace_orders` - When someone buys it
- `marketplace_offers` - When someone makes an offer

---

### 6️⃣ Messages (/messages)

**File:** `client/pages/Messages.tsx`
**Tables:** `messages`, `pickups`

**How it works:**

```typescript
// Send message to worker
const message = await sendMessage({
  pickup_id: pickupId, // Associated with pickup
  from_user_id: user?.id || "mock-user-1",
  to_user_id: "worker-bot",
  body: "When can you pick up my items?",
});

// Groq API provides AI response
const reply = await getAIReply(content, context);
// Now uses Groq instead of OpenAI

// Auto-reply saved back to messages table
await sendMessage({
  pickup_id: pickupId,
  from_user_id: "worker-bot",
  to_user_id: user?.id,
  body: reply, // AI-generated response
});
```

**Message Thread:**

```sql
SELECT * FROM messages
WHERE pickup_id = 'pickup-123'
ORDER BY created_at ASC;

-- Returns conversation history:
-- User: "When can you pick up?"
-- Bot: "We can pick up tomorrow between 2-4 PM"
-- User: "Perfect! See you then"
-- Bot: "Great! We'll send a reminder SMS"
```

---

## 🔄 Data Synchronization

### Local Storage Fallback

All features use this pattern:

```typescript
const readLocal = (): Item[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocal = (list: Item[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
};

export async function createItem(input) {
  const item = { id: `local-${Date.now()}`, ...input };

  // Always save to localStorage first (offline support)
  const list = readLocal();
  list.unshift(item);
  writeLocal(list);

  // Try Supabase if available (online sync)
  if (!supabase) return item;

  const { data, error } = await supabase
    .from("items")
    .insert(item)
    .select("*")
    .single();

  if (error) console.warn("Supabase sync failed:", error);
  return data || item;
}
```

**Benefits:**

- ✅ Works offline
- ✅ Syncs when online
- ✅ No data loss

---

## 📊 Database Queries in Components

### Example 1: List User's Pickups

```typescript
// client/lib/pickups.ts
export async function listUserPickups(userId: string): Promise<Pickup[]> {
  if (!supabase) {
    return readLocal()
      .filter((p) => p.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const { data, error } = await supabase
    .from("pickups")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// In component:
const { user } = useAuth();
const [pickups, setPickups] = useState<Pickup[]>([]);

useEffect(() => {
  listUserPickups(user?.id || "mock-user-1")
    .then(setPickups)
    .catch(console.error);
}, [user?.id]);
```

### Example 2: Search Listings

```typescript
// client/lib/marketplace.ts
export async function listListings(filter?: ListingFilter): Promise<Listing[]> {
  if (!supabase) {
    let items = read<Listing>(LS_LISTINGS);
    if (filter?.q) {
      items = items.filter((i) =>
        (i.title + " " + (i.description || ""))
          .toLowerCase()
          .includes(filter.q!.toLowerCase()),
      );
    }
    return items;
  }

  let q = supabase.from("marketplace_listings").select("*");
  if (filter?.category) q = q.eq("category", filter.category);
  if (filter?.min) q = q.gte("price", filter.min);
  if (filter?.max) q = q.lte("price", filter.max);

  const { data, error } = await q.order("created_at", { ascending: false });
  return data || [];
}
```

---

## 🔐 Row Level Security (RLS)

Your tables have RLS enabled. Users can only see:

- ✅ Their own pickups
- ✅ Their own reports
- ✅ Their own messages
- ✅ Active marketplace listings
- ✅ Their own profile

**Example - Pickup Privacy:**

```sql
-- User 'user-1' can see this:
SELECT * FROM pickups WHERE user_id = 'user-1';

-- User 'user-2' cannot see user-1's pickups:
SELECT * FROM pickups WHERE user_id = 'user-1'; -- Returns []
```

**In React Code:**

```typescript
// Always use authenticated user context
const { user } = useAuth();

// Query automatically filtered by RLS
const { data } = await supabase
  .from("pickups")
  .select("*")
  .eq("user_id", user?.id);
// Only returns this user's pickups

// No need to check permissions manually - DB enforces it!
```

---

## ✨ Best Practices

### 1. Error Handling

```typescript
try {
  const result = await supabase.from("pickups").insert(pickup);

  if (error) {
    console.error("Insert failed:", error.message);
    // Fallback: use localStorage
    writeLocal([...readLocal(), pickup]);
  }
} catch (err) {
  console.error("Unexpected error:", err);
  toast({ title: "Error", description: "Failed to save pickup" });
}
```

### 2. Loading States

```typescript
const [loading, setLoading] = useState(false);

const load = async () => {
  setLoading(true);
  try {
    const data = await listPickups(userId);
    setPickups(data);
  } finally {
    setLoading(false);
  }
};
```

### 3. Real-time Updates

```typescript
// Subscribe to changes (optional)
supabase
  .from("pickups")
  .on("*", (payload) => {
    console.log("Change received!", payload);
    // Refresh data
  })
  .subscribe();
```

### 4. Type Safety

```typescript
// Use TypeScript interfaces
interface Pickup {
  id: string;
  user_id: string;
  status: 'requested' | 'scheduled' | 'collected';
  // ... other fields
}

// Type-safe queries
const { data, error } = await supabase
  .from('pickups')
  .select('*')
  .eq('status', 'scheduled') // Compiler checks this exists
  as { data: Pickup[] }
```

---

## 🧪 Testing Queries

### Test in Supabase Dashboard

1. Go to **SQL Editor**
2. Run test queries:

```sql
-- Check pickups table
SELECT COUNT(*) as total_pickups FROM pickups;

-- Find user's pickups
SELECT * FROM pickups WHERE user_id = 'user-123' LIMIT 10;

-- Get pending reports
SELECT * FROM illegal_reports WHERE status = 'new';

-- Check marketplace listings
SELECT * FROM marketplace_listings WHERE is_active = TRUE LIMIT 10;

-- Verify RLS works
SELECT * FROM pickups WHERE user_id = 'different-user'; -- Should return []
```

### Test in React Component

```typescript
// Add debug component
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function DebugDatabase() {
  useEffect(() => {
    const test = async () => {
      // Test each table
      const tables = [
        'pickups', 'illegal_reports', 'messages', 'buyback_orders',
        'marketplace_listings', 'user_profiles', 'recycling_centers'
      ];

      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(1);

        console.log(`${table}: ${count} records, error: ${error?.message}`);
      }
    };

    test();
  }, []);

  return <div>Check console for database status</div>;
}
```

---

## 🚀 Deployment Checklist

- [ ] SQL schema deployed to Supabase
- [ ] All 12 tables created and verified
- [ ] RLS policies active
- [ ] Environment variables set
- [ ] Test queries run successfully
- [ ] React app tested with real Supabase data
- [ ] Offline fallback (localStorage) working
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] User authentication working
- [ ] All 6 features integrated and tested

---

## 📈 Monitoring

### Check Database Health

```sql
-- View recent errors
SELECT * FROM pg_stat_statements
WHERE query LIKE '%error%'
ORDER BY calls DESC;

-- Check table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor connections
SELECT usename, application_name, state, count(*)
FROM pg_stat_activity
GROUP BY 1, 2, 3;
```

### Set Up Alerts

In Supabase Dashboard → **Monitoring**:

- Alert on high query latency
- Alert on connection errors
- Alert on storage quota nearing limit

---

## 🆘 Troubleshooting

### Issue: "Cannot POST to /api/ai-chat"

**Solution:** Groq API key may be missing

```bash
# Check environment
echo $GROQ_API_KEY
```

### Issue: "RLS policy prevents insert"

**Solution:** Use authenticated user's ID

```typescript
const { user } = useAuth();
await supabase
  .from('pickups')
  .insert({ user_id: user?.id, ... }); // Must match auth user
```

### Issue: "Foreign key constraint violation"

**Solution:** Create parent record first

```typescript
// Create user profile first
await supabase.from('user_profiles').insert({ id: userId, ... });

// Then create related records
await supabase.from('pickups').insert({ user_id: userId, ... });
```

### Issue: Data not syncing between tabs

**Solution:** Use real-time subscriptions or polling

```typescript
const unsubscribe = supabase
  .from("pickups")
  .on("*", (payload) => {
    // Refresh data
    loadPickups();
  })
  .subscribe();

// Cleanup
return () => unsubscribe();
```

---

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Last Updated:** January 2024  
**Status:** Ready for Integration ✅

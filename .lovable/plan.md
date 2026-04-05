

# Plan: Paystack Payment Integration + Verify Edge Function

## Important Security Note
Your **Paystack secret key** (`sk_live_...`) was shared in chat. Secret keys must never be stored in code. We will store it as a backend secret. The **public key** (`pk_live_...`) is safe to use in frontend code.

## What We're Building

1. **Store Paystack secret key** as a backend secret
2. **Create a `verify-payment` edge function** that verifies Paystack transactions server-side
3. **Add Paystack checkout to BrowseFood** — when placing an order, open Paystack popup, then verify payment before saving the order
4. **Add Paystack to Group Buy join flow** — pay group price when joining
5. **Payment status on orders** — add a `payment_status` and `payment_reference` column to orders table

## Technical Steps

### Step 1: Add Secret
Use `add_secret` to store `PAYSTACK_SECRET_KEY` with value `sk_live_46db76c5ff153171075ed9dc5fbe5eed4471f7bb`.

### Step 2: Database Migration
Add columns to `orders` table:
```sql
ALTER TABLE orders ADD COLUMN payment_reference text;
ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
```

### Step 3: Edge Function `verify-payment`
`supabase/functions/verify-payment/index.ts`:
- Accepts `{ reference }` in POST body
- Calls `https://api.paystack.co/transaction/verify/{reference}` with secret key
- On success: updates order's `payment_status` to `paid`, logs event
- On failure: logs security event, returns error
- CORS headers included

### Step 4: Update BrowseFood.tsx
- Install `@paystack/inline-js` (or use the CDN script approach via `react-paystack`)
- Replace direct order insertion with: create order (status pending) → open Paystack popup → on callback, call `verify-payment` edge function → update order status
- Public key: `pk_live_efc7f697d85e3814c0eac669cb42221df8cb1ba1`

### Step 5: Update GroupBuySection.tsx
- Add Paystack payment before joining a group buy
- Amount = group_price from the group buy record

### Step 6: Order Status Display
- Update `OrdersList.tsx` to show payment badge (paid/pending/failed)

## Dependencies
- `react-paystack` npm package (React wrapper for Paystack inline)

## Files Changed
- `supabase/functions/verify-payment/index.ts` (new)
- `src/components/BrowseFood.tsx` (add Paystack checkout flow)
- `src/components/GroupBuySection.tsx` (add payment on join)
- `src/components/OrdersList.tsx` (show payment status badge)
- Database migration for `payment_reference` and `payment_status` columns


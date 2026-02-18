# RevenueCat setup for Dental Clinic Pro

Subscription pricing: **$150/month**, **$1,000/year**, **$5,000 lifetime**.

## 1. Environment variable

In `.env.local` add:

```env
# Use Sandbox key for testing, Public API Key for production
NEXT_PUBLIC_REVENUECAT_API_KEY=test_KxxBLNyjRfahLVasnkgVCwyldau
```

Get keys from: RevenueCat Dashboard → Project → Apps → **Web** (Web Billing) → API Keys.

## 2. RevenueCat Dashboard configuration

1. **Create a Web Billing app** (if not already): Project → Apps → Add app → Web (RevenueCat Web Billing). Connect Stripe when prompted.

2. **Entitlement**
   - Entitlements → Add entitlement
   - Identifier: **`pro`** (must match `PRO_ENTITLEMENT_ID` in `lib/revenuecat.ts`)

3. **Products** (Web Billing product setup)
   - Create three products and attach them to the **pro** entitlement:
     - **Monthly**: $150 USD, recurring monthly
     - **Yearly**: $1,000 USD, recurring yearly
     - **Lifetime**: $5,000 USD, one-time (if supported by your Web Billing setup)

4. **Offering**
   - Offerings → Create offering (e.g. "default") → Set as **Current**
   - Add **Packages** that reference the above products (e.g. `$rc_monthly`, `$rc_annual`, `$rc_lifetime` or your product IDs)

5. **Paywall**
   - Paywalls → Create paywall → Attach to the **default** offering
   - Design the paywall (packages will appear from your offering). Publish when ready.

## 3. What’s implemented in the app

- **SDK**: `@revenuecat/purchases-js` in `lib/revenuecat.ts` (configure, entitlement check, customer info).
- **Auth**: RevenueCat is configured with the logged-in user’s ID when they open the dashboard (`RevenueCatInit` in dashboard layout).
- **Entitlement**: Pro access is determined by the **pro** entitlement in RevenueCat.
- **Settings → Billing**: Shows Free/Pro status, **Manage subscription** (customer portal link when subscribed), and three plan cards (Monthly $150, Yearly $1,000, Lifetime $5,000) with **Upgrade** opening the RevenueCat paywall.
- **Customer portal**: When the user has an active subscription, `customerInfo.managementURL` is used for “Manage subscription” and “Open Customer Portal” (update payment, invoices, cancel).

## 4. Testing

- Use the **Sandbox** API key in `.env.local` for test purchases.
- In RevenueCat dashboard you can use test cards and sandbox mode for Web Billing.
- After a test purchase, the Billing tab should show “Pro” and the manage/subscription link.

## 5. Production

- Replace `NEXT_PUBLIC_REVENUECAT_API_KEY` with the **Public API Key** (not the Sandbox key).
- Ensure products and prices in RevenueCat/Stripe match: $150/month, $1,000/year, $5,000 lifetime.

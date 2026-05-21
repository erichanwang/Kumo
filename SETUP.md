# Kumo Pro Setup Guide

This guide walks you through setting up user authentication and Stripe subscriptions for Kumo using Supabase and Stripe.

## Overview

Kumo uses:
- **Supabase Auth** — for user sign-up, sign-in, and session management
- **Supabase PostgreSQL** — for storing user profiles and subscription tiers
- **Stripe** — for payment processing
- **Supabase Edge Functions** — for Stripe webhook handling and checkout session creation

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier works)
- A [Stripe](https://stripe.com) account
- The Kumo extension source code

## Step 1: Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from **Project Settings → API**
3. In the **SQL Editor**, paste and run the contents of `supabase/migrations/001_kumo_profiles.sql`

## Step 2: Configure Supabase Auth

1. Go to **Authentication → Providers** in your Supabase dashboard
2. Enable **Email** auth (default is on)
3. (Optional) Enable **Google** auth:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create an OAuth 2.0 Client ID (Web application type)
   - Add the redirect URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret to Supabase Auth → Google provider
4. (Optional) Enable **GitHub** or other providers the same way

## Step 3: Set Up Stripe

1. Go to [stripe.com](https://stripe.com) and create an account
2. Go to **Products** and create the following products/prices:

| Product | Price | Interval | Price ID |
|---------|-------|----------|----------|
| Kumo Weekly | $0.99 | week | `price_xxxxx1` |
| Kumo Monthly | $2.99 | month | `price_xxxxx2` |
| Kumo Yearly | $24.99 | year | `price_xxxxx3` |

3. Go to **Developers → Webhooks** and add an endpoint:
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Step 4: Deploy Supabase Edge Functions

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   supabase login
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Deploy the Stripe checkout function (create at `supabase/functions/stripe-checkout/index.ts`):
   ```typescript
   import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
   import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

   const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { httpClient: Stripe.createFetchHttpClient() })
   const supabaseAdmin = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
   )

   serve(async (req) => {
     const { priceId, userId, email } = await req.json()

     try {
       const session = await stripe.checkout.sessions.create({
         mode: 'subscription',
         payment_method_types: ['card'],
         line_items: [{ price: priceId, quantity: 1 }],
         customer_email: email,
         client_reference_id: userId,
         success_url: 'https://YOUR_EXTENSION_ID.chromiumapp.org/account.html?success=true',
         cancel_url: 'https://YOUR_EXTENSION_ID.chromiumapp.org/account.html?canceled=true',
         metadata: { userId },
       })

       return new Response(JSON.stringify({ url: session.url }), {
         headers: { 'Content-Type': 'application/json' },
       })
     } catch (err) {
       return new Response(JSON.stringify({ error: err.message }), { status: 400 })
     }
   })
   ```

4. Deploy the Stripe webhook function (create at `supabase/functions/stripe-webhook/index.ts`):
   ```typescript
   import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
   import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

   const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { httpClient: Stripe.createFetchHttpClient() })
   const supabaseAdmin = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
   )

   serve(async (req) => {
     const signature = req.headers.get('stripe-signature')!
     const body = await req.text()

     let event: Stripe.Event
     try {
       event = stripe.webhooks.constructEvent(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
     } catch {
       return new Response('Invalid signature', { status: 400 })
     }

     const session = event.data.object as Stripe.Checkout.Session
     const userId = session.metadata?.userId || session.client_reference_id

     switch (event.type) {
       case 'checkout.session.completed':
         if (userId) {
           await supabaseAdmin
             .from('profiles')
             .update({
               subscription_tier: 'pro',
               subscription_status: 'active',
               stripe_customer_id: session.customer as string,
               stripe_subscription_id: session.subscription as string,
               subscription_period_end: new Date(
                 (session as any).expires_at * 1000
               ).toISOString(),
             })
             .eq('id', userId)
         }
         break

       case 'customer.subscription.updated':
       case 'customer.subscription.deleted':
         const subscription = event.data.object as Stripe.Subscription
         const isActive = subscription.status === 'active' || subscription.status === 'trialing'
         const { data: profile } = await supabaseAdmin
           .from('profiles')
           .select('id')
           .eq('stripe_subscription_id', subscription.id)
           .single()

         if (profile) {
           await supabaseAdmin
             .from('profiles')
             .update({
               subscription_tier: isActive ? 'pro' : 'free',
               subscription_status: subscription.status,
               subscription_period_end: new Date(
                 subscription.current_period_end * 1000
               ).toISOString(),
             })
             .eq('id', profile.id)
         }
         break
     }

     return new Response('OK', { status: 200 })
   })
   ```

5. Set environment secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

6. Deploy the functions:
   ```bash
   supabase functions deploy stripe-checkout
   supabase functions deploy stripe-webhook
   ```

## Step 5: Configure the Extension

1. Open `src/lib/auth.ts` and replace the placeholder values:
   ```typescript
   const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   ```

2. Update the Edge Function URLs in `account.ts`:
   ```typescript
   const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
   ```

## Step 6: Update manifest.json

Make sure `account.html` is listed in `web_accessible_resources`:

```json
"web_accessible_resources": [
  {
    "resources": ["account.html", "account.js", ...],
    "matches": ["<all_urls>"]
  }
]
```

## Step 7: Build & Load

1. Build the extension:
   ```bash
   npm run build
   ```

2. Load in Chrome:
   - Go to `chrome://extensions`
   - Enable Developer Mode
   - Click "Load unpacked" and select the `dist/` folder

## Step 8: Test the Flow

1. Click the Kumo popup → click **Account**
2. Sign up with an email/password
3. Verify the plan badge in the popup says "Free"
4. Click "Upgrade to Pro" on the Account page
5. Complete the Stripe Checkout (use card number `4242 4242 4242 4242` in test mode)
6. After redirect, the account page should show "Pro"
7. Verify the popup plan badge now says "✦ Pro"

## Feature Tiers

### Free Plan
| Feature | Limit |
|---------|-------|
| Word bank size | 1,000 entries |
| Subtitle furigana | 100 words/session |
| SRS cards/day | 10 cards |
| Sentence mining | ❌ |
| Anki export | ❌ |
| Hover popup definitions | ✅ |
| Basic furigana | ✅ |
| JLPT progress tracking | ✅ |
| CSV export | ✅ |

### Pro Plan
| Feature | Limit |
|---------|-------|
| Word bank size | Unlimited |
| Subtitle furigana | Unlimited |
| SRS cards/day | Unlimited |
| Sentence mining | ✅ |
| Anki export | ✅ |
| Priority support | ✅ |

## Troubleshooting

- **Sign-in fails**: Check that the Supabase URL and anon key are correct
- **Stripe checkout doesn't open**: Ensure the Edge Function is deployed and `STRIPE_SECRET_KEY` is set
- **Webhook not updating profile**: Check the Stripe webhook signing secret and that the endpoint URL is correct
- **"For testing, you can use:" messages**: These appear when Supabase keys are still at placeholder defaults

For more help, visit [codebuff.com/docs](https://codebuff.com/docs) or open an issue on GitHub.

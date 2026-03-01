# 🏓 DINK — Pickleball Tournament Manager

A mobile-first, senior-friendly pickleball tournament management app with Stripe payments, DUPR integration, Google Maps court finder, and Firebase auth/push notifications.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in your API keys (see below)

# 3. Run locally
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "Initial commit"
gh repo create dink --public --push

# 2. Deploy
npx vercel

# 3. Add environment variables in Vercel dashboard:
#    Settings → Environment Variables → add all from .env.example
```

Or connect your GitHub repo at [vercel.com/new](https://vercel.com/new).

## API Keys You Need

| Service | What | Where to Get |
|---------|------|-------------|
| **Stripe** | Payments ($9/mo subscription) | [dashboard.stripe.com](https://dashboard.stripe.com) |
| **Firebase** | Auth, Firestore DB, Push notifications | [console.firebase.google.com](https://console.firebase.google.com) |
| **Google Maps** | Court finder with Places API | [console.cloud.google.com](https://console.cloud.google.com) |
| **Google OAuth** | "Sign in with Google" | [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) |
| **DUPR** | Rating sync (optional) | [dupr.com/developer](https://dupr.com) |

## Setup Guide

### 1. Stripe ($9/mo subscription)
1. Create a Stripe account
2. Create a Product → "DINK Pro" → $9/month recurring price
3. Copy the Price ID → `STRIPE_PRICE_ID`
4. Get API keys from Developers → API Keys
5. Set up webhook endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
   - Listen for: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### 2. Firebase
1. Create a Firebase project
2. Enable **Authentication** → Email/Password + Google providers
3. Enable **Cloud Firestore** → Start in production mode
4. Go to Project Settings → Service Accounts → Generate new private key
5. Copy values to env vars

### 3. Google Maps
1. Enable **Places API** and **Maps JavaScript API** in Google Cloud Console
2. Create API key → restrict to your domain
3. Copy key → `GOOGLE_MAPS_API_KEY`

### 4. Google OAuth
1. In Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web Application)
3. Add authorized redirect: `https://your-domain.vercel.app/api/auth/google/callback`
4. Copy Client ID and Secret

## Project Structure

```
dink/
├── app/
│   ├── layout.js              # Root layout with metadata
│   ├── page.js                # Main page (loads DinkApp)
│   └── api/
│       ├── auth/
│       │   ├── login/route.js      # Email/password login
│       │   ├── signup/route.js     # New account creation
│       │   └── google/
│       │       ├── route.js        # Google OAuth redirect
│       │       └── callback/route.js # Google OAuth callback
│       ├── stripe/
│       │   ├── checkout/route.js   # Create Stripe checkout
│       │   ├── webhook/route.js    # Handle Stripe events
│       │   └── verify/route.js     # Verify subscription
│       ├── courts/route.js         # Google Places court search
│       └── push/register/route.js  # Save push tokens
├── components/
│   └── DinkApp.jsx            # Full app UI (login → paywall → app)
├── lib/
│   ├── auth.js                # JWT helpers
│   ├── firebase.js            # Firebase client SDK
│   ├── firebase-admin.js      # Firebase Admin SDK
│   └── stripe.js              # Stripe SDK init
├── public/
│   └── manifest.json          # PWA manifest
├── .env.example               # Environment variables template
├── next.config.js             # Next.js configuration
├── vercel.json                # Vercel deployment config
└── package.json               # Dependencies
```

## Features

- **3-screen flow**: Login → $9 Paywall → Full App
- **Senior-friendly**: 3 font sizes (Small/Medium/Large), large tap targets, high contrast
- **Light theme**: Clean cream/white design with green accents
- **5 tabs**: Tournaments, Partners, Matches, Courts, Gear
- **Live score entry**: Tap-to-score during matches
- **US/UK support**: DUPR vs UKPA ratings, date formats, currency
- **PWA**: Installable on mobile home screen

## License

Private — All rights reserved.

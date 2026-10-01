# VORTEX - By Brilliant Mere

VORTEX is a small, honest social-feed MVP built in Botswana. The current release includes a working profile name, post creation, local feed persistence, search, and likes. Posts are stored in the browser on the current device.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Current scope

This version intentionally does not show fake wallet balances, fake chat messages, or claim that accounts are connected to a server. Chat, authentication, moderation, and cloud storage still require a backend before a public production launch. Do not collect payment information until a secure payment provider and server-side authorization are implemented.

## Before public launch

- Add Supabase Auth and a server-backed `profiles` table.
- Move posts and likes from localStorage to a protected database API.
- Add reporting, moderation, privacy policy, terms, account deletion, and age/content controls.
- Connect a real payment provider only after server-side authorization and compliance review.
- Build and test the Android AAB and complete Google Play Data safety and store listing declarations.

Never commit `.env` or secrets. Use `.env.example` as a template.

# CTF Platform

A production-ready Capture The Flag platform built with Next.js 14, TypeScript, TailwindCSS, and Supabase.

## Stack

- **Frontend**: Next.js 14 App Router + TypeScript + TailwindCSS
- **Backend**: Supabase (Auth, Postgres, Storage, Edge Functions)
- **Deployment**: Vercel + Supabase

## Features

- 🔐 Email/password auth with email verification
- 📚 Learning rooms with sequential tasks (unlock-on-solve)
- 🚩 CTF challenges grouped by category
- 🏆 Global leaderboard with live rankings
- 🛡️ Admin panel for CRUD operations
- 🔒 Rate-limited flag validation via Edge Function
- 🎨 Dark terminal/hacker aesthetic with neon accents

## Setup

### 1. Clone & install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in your Supabase project URL, anon key, and service role key
```

### 3. Run Supabase migration

Apply `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

### 4. Deploy Edge Function

```bash
supabase functions deploy validate-flag
supabase secrets set FLAG_PEPPER=your-random-secret
```

### 5. Run locally

```bash
npm run dev
```

## Architecture

### Flag Security

Flags are stored as **HMAC-SHA256 hashes** with a server-side pepper (never exposed to clients). Validation occurs only in the Supabase Edge Function with rate limiting (5 attempts/min per user, 10/min per IP).

### RLS Policies

- `flag_hash` column is **revoked** from the `authenticated` role at the DB level
- All writes go through the service role (Edge Function)
- Users can only read their own submissions and progress

### Directory Structure

```
app/              # Next.js App Router pages
actions/          # Server Actions (auth, submissions, admin)
components/       # React components (ui/, layout/, features)
lib/supabase/     # Supabase client helpers
types/            # TypeScript type definitions
supabase/
  migrations/     # SQL schema
  functions/      # Edge Functions (validate-flag)
```

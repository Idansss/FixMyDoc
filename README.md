# FixMyDoc

Next.js 14 app for analyzing and improving documents (CV, legal, academic, business) with AI. Includes upload, analysis, Stripe billing, export (PDF/DOCX), and transactional emails.

## Stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**
- **Clerk** — auth (Google + email)
- **Supabase** — Postgres + Storage (server uses **service role** key only on the server; never expose it client-side)
- **Anthropic** — Claude for document analysis
- **Stripe** — subscriptions (Pro $9/mo, Business $29/mo)
- **Resend** — welcome, usage limit, upgrade emails
- **Upstash Redis** — rate limiting (10 req/min per user for `/api/analyze` and `/api/upload`)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example env file and fill in values:

```bash
cp .env.local.example .env.local
```

See `.env.local.example` for every variable. Required:

- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- **Anthropic**: `ANTHROPIC_API_KEY`
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_BUSINESS_PRICE_ID`
- **Resend**: `RESEND_API_KEY`, optional `RESEND_FROM_EMAIL`
- **Upstash** (optional but recommended): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **App**: `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)

### 3. Supabase tables

Run the following SQL in the Supabase SQL editor (or migrations).

**Users** (sync with Clerk via webhook; service role used only in API routes):

```sql
create table if not exists public.users (
  id text primary key,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  usage_count int not null default 0,
  usage_reset_at timestamptz,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);
```

**Documents**:

```sql
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id),
  filename text not null,
  doc_type text not null,
  score numeric,
  created_at timestamptz not null default now()
);
```

**Rewrites**:

```sql
create table if not exists public.rewrites (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id),
  original_text text not null,
  fixed_text text not null,
  created_at timestamptz not null default now()
);
```

**Storage**: Create a storage bucket named `documents` (private or with RLS as needed). API uploads files under `{user_id}/{timestamp}-{filename}`.

**RLS**: Enable RLS on tables if desired; all server-side access uses the **service role** client in `lib/supabase/server.ts`, which bypasses RLS. The **anon** key is only used in `lib/supabase/client.ts` for client-side usage and must never be given the service role key.

### 4. Clerk

- Create an application and add Google + Email (or email/password) sign-in.
- In Dashboard → Webhooks, add endpoint: `https://your-domain.com/api/webhooks/clerk` (or use ngrok for local: `https://xxx.ngrok.io/api/webhooks/clerk`). Subscribe to `user.created`. Copy the signing secret into `CLERK_WEBHOOK_SECRET`.

### 5. Stripe

- Create Products: Pro ($9/month) and Business ($29/month). Copy each Price ID to `STRIPE_PRO_PRICE_ID` and `STRIPE_BUSINESS_PRICE_ID`.
- Webhooks: add endpoint `https://your-domain.com/api/stripe/webhook`. Events: `checkout.session.completed`, `customer.subscription.deleted`. Copy signing secret to `STRIPE_WEBHOOK_SECRET`. Use the **raw** body for verification (this app uses `req.text()` in the webhook handler).

### 6. Resend

- Create an API key and set `RESEND_API_KEY`. Optionally set `RESEND_FROM_EMAIL` to a verified domain.

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in (Clerk), then use the dashboard. Protect `/dashboard` via middleware (already configured).

## API overview

- `POST /api/upload` — multipart file (PDF/DOCX, max 5MB) + `docType`; returns `documentId`, `extractedText`. Rate limited.
- `POST /api/analyze` — body: `{ documentId, extractedText, docType }`; returns analysis and `rewriteId`. Free plan: 1 run/day; then 403 + usage_limit email. Rate limited.
- `POST /api/stripe/checkout` — body: `{ priceId }`; returns Stripe Checkout URL.
- `POST /api/stripe/webhook` — Stripe webhooks (raw body).
- `POST /api/stripe/portal` — returns Stripe Customer Portal URL.
- `POST /api/export` — body: `{ rewriteId, format }` (`pdf` | `docx` | `txt`). Free users get 403 with `{ error: "upgrade_required" }` for PDF/DOCX.
- `POST /api/webhooks/clerk` — Clerk `user.created` → create user row, send welcome email.

## Security note

- **Supabase**: The **service role** key is used only in server-side code (`lib/supabase/server.ts`, API routes). It is never exposed to the client. The client uses only `NEXT_PUBLIC_SUPABASE_ANON_KEY` via `lib/supabase/client.ts`.

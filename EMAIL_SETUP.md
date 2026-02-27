# Waitlist welcome email setup

When someone joins the waitlist, the site can send them an automated welcome email. This uses **Resend** and a **Supabase Edge Function**.

## 1. Get a Resend API key

1. Sign up at [resend.com](https://resend.com) (free tier is enough).
2. In the dashboard, go to **API Keys** and create a key.
3. Copy the key (it starts with `re_`).

For testing, Resend lets you send from `onboarding@resend.dev`. For production, add and verify your own domain in Resend so you can use e.g. `CareMap <hello@yourdomain.com>`.

## 2. Add the key to Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Project Settings** → **Edge Functions** (or **Secrets**).
3. Add a secret:
   - **Name:** `RESEND_API_KEY`
   - **Value:** your Resend API key.

Optional: to use your own “from” address, add:

- **Name:** `FROM_EMAIL`
- **Value:** `CareMap <hello@yourdomain.com>` (use an address from a domain you verified in Resend).

## 3. Deploy the Edge Function

From the project root (where `index.html` is), run:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set RESEND_API_KEY=re_your_actual_key
npx supabase functions deploy send-waitlist-email
```

Replace `YOUR_PROJECT_REF` with your Supabase project reference (from the project URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`). If you set the secret in the dashboard, you can skip `npx supabase secrets set`.

After this, each new waitlist signup will trigger the function and send the welcome email.

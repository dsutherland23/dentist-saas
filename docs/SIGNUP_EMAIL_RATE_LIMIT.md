# "Email rate limit exceeded" on signup

When creating a new account, Supabase Auth sends a confirmation email. Supabase applies **rate limits** on auth emails (e.g. **2 emails per hour** on the default/free tier), so you may see:

- **"Email rate limit exceeded"**

## Quick fixes

### 1. For local / development

**Turn off email confirmation** so signup does not send an email:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Providers** → **Email**.
3. Turn **off** “Confirm email”.
4. Save.

New signups will be created without sending a confirmation email, so you won’t hit the limit during development.

### 2. For production

- **Custom SMTP**  
  Use your own SMTP (e.g. SendGrid, AWS SES) so limits are controlled by your provider:  
  **Project Settings** → **Authentication** → **SMTP**.

- **Rate limits**  
  If your plan allows it, adjust limits under **Authentication** → **Rate limits** in the dashboard (or via Management API).

### 3. End users

If a user hits the limit, they’ll see a friendly message asking them to wait about an hour and try again or use a different email.

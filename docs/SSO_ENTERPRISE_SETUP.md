# Enterprise SSO Setup (SAML 2.0)

The login page supports **SSO Enterprise Login** using Supabase Auth’s SAML 2.0 support. Users click “SSO Enterprise Login”, enter their work email (or organization domain), and are redirected to your identity provider (IdP) to sign in.

## Requirements

- **Supabase plan:** SAML 2.0 SSO is available on **Pro** and above. See [Supabase Pricing](https://supabase.com/pricing).
- **Supabase Dashboard:** Enable SAML under **Authentication → Providers** and add your IdP (see below).

## Configure SSO in Supabase

1. In the [Supabase Dashboard](https://supabase.com/dashboard), open your project → **Authentication** → **Providers**.
2. Enable **SAML 2.0** if it’s not already on.
3. Add your identity provider via the **Supabase CLI** (SAML is configured via CLI, not the Dashboard UI):

   ```bash
   supabase sso add --type saml --project-ref <your-project-ref> \
     --metadata-url 'https://your-idp.com/saml/metadata' \
     --domains yourcompany.com
   ```

   Or with a metadata file:

   ```bash
   supabase sso add --type saml --project-ref <your-project-ref> \
     --metadata-file ./path/to/idp-metadata.xml \
     --domains yourcompany.com
   ```

4. Use the **ACS URL** and **Metadata URL** from the Dashboard (or `supabase sso info --project-ref <ref>`) when configuring your IdP. Supabase’s SAML URLs look like:
   - **EntityID / Metadata:** `https://<project-ref>.supabase.co/auth/v1/sso/saml/metadata`
   - **ACS URL:** `https://<project-ref>.supabase.co/auth/v1/sso/saml/acs`

## How it works in the app

1. User clicks **SSO Enterprise Login** on `/login`.
2. A dialog asks for **work email** or **organization domain** (e.g. `you@company.com` or `company.com`).
3. The app extracts the domain and calls Supabase `signInWithSSO({ domain, options: { redirectTo: '.../auth/callback?next=/dashboard' } })`.
4. Supabase redirects the user to the IdP registered for that domain.
5. After sign-in, the IdP redirects back to Supabase, which then redirects to your app’s **Auth callback** (`/auth/callback`) with a `code`.
6. The callback exchanges the `code` for a session and redirects to `/dashboard` (or the `next` path).

## Redirect URL

Ensure your **Site URL** and **Redirect URLs** in Supabase (Authentication → URL Configuration) include:

- `https://your-domain.com/auth/callback`
- For local dev: `http://localhost:3000/auth/callback`

## Multiple organizations (multi-tenant)

You can add multiple SAML IdPs (one per organization) with different domains. Each domain is mapped to one IdP; users enter their work email and are sent to the correct IdP. Use `supabase sso list` and `supabase sso add` to manage providers.

## Troubleshooting

- **“No SSO provider found for this domain”**  
  No SAML IdP is registered for that domain. Add the IdP with `--domains yourcompany.com` (or the domain part of the user’s email).

- **“SAML assertion does not contain email address”**  
  Configure the IdP to send an email attribute (e.g. `mail` or `email`) in the SAML assertion. Supabase requires an email for the user.

- **Callback returns “Could not complete sign-in”**  
  Check that the Auth callback URL is in Supabase redirect URLs and that the IdP’s ACS URL points to Supabase’s ACS URL.

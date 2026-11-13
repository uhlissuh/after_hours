# After Hours Crafts owner setup

The public site can remain on the free Cloudflare Pages URL. The private inventory dashboard is at `/admin/` and uses Google sign-in restricted to `alissasobo@gmail.com`.

## 1. Create the D1 database

In Cloudflare:

1. Open **Workers & Pages → D1 SQL database → Create database**.
2. Name it `after-hours-crafts`.
3. Open the database's **Console**.
4. Run the contents of `schema.sql`.
5. Copy the database ID into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
6. In the Pages project, open **Settings → Functions → D1 database bindings**.
7. Add the binding `DB` and select the `after-hours-crafts` database.

## 2. Create Google OAuth credentials

In [Google Cloud Console](https://console.cloud.google.com/):

1. Create or select a project.
2. Configure the OAuth consent screen.
3. Create an OAuth client with application type **Web application**.
4. Add this authorized redirect URI, replacing the hostname with the deployed Pages URL:

   `https://YOUR_PROJECT.pages.dev/api/auth/callback`

5. In Pages project settings, add these encrypted environment variables:

   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

The code only permits `alissasobo@gmail.com` after Google returns the profile.

## 3. Create the photo bucket

Product images are stored in Cloudflare R2 and served through the Pages Function at `/api/uploads`.

Create the bucket:

```bash
npx wrangler r2 bucket create after-hours-crafts-images
```

The `IMAGES` binding is already declared in `wrangler.toml`. If your Pages project uses dashboard bindings instead, add an R2 bucket binding named `IMAGES` and select `after-hours-crafts-images`.

## 4. Database migrations

`./start-local.sh` automatically runs:

```bash
npm run migrate:local
```

before starting the local Pages server.

To apply pending migrations to the live Cloudflare database, run:

```bash
./migrate-production.sh
```

The script uses the Cloudflare account authorized by `npx wrangler login`, shows the pending migrations, and asks for confirmation before changing the live database. No Cloudflare API token or GitHub Actions secret is needed.

## 5. Connect Stripe Checkout

Stripe Checkout accepts payment and collects a US shipping address. Completed purchases are saved in D1 and appear at `/admin/orders.html`.

1. In the [Stripe Dashboard](https://dashboard.stripe.com/), copy the **Secret key** for the mode you want to use. Start with the test-mode key.
2. In the Cloudflare project settings, add an encrypted environment variable named `STRIPE_SECRET_KEY`.
3. In Stripe, open **Developers → Webhooks**, add an endpoint, and use:

   `https://YOUR_PROJECT.pages.dev/api/stripe/webhook`

4. Subscribe the endpoint to `checkout.session.completed`.
5. Copy the webhook endpoint's signing secret and add it to Cloudflare as the encrypted environment variable `STRIPE_WEBHOOK_SECRET`.
6. Redeploy the Pages project after adding the variables.

For local Stripe testing, put test values in `.dev.vars`:

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Never commit `.dev.vars` or either Stripe secret. Stripe test purchases do not move real money. Switch to the live secret and create a live-mode webhook only when the store is ready to accept real orders.

## 6. Deploy

Push the project to GitHub. Pages will deploy the `functions/` directory along with the site. Open `/admin/` and choose **Continue with Google**.

For local development, Pages Functions and D1 need Wrangler rather than the plain Python server:

```bash
npx wrangler pages dev .
```

The simple `python3 -m http.server 8000` command still works for previewing the public, static storefront, but it cannot run the `/api` routes.

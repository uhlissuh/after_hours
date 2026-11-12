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

For an existing D1 database, add the new product fields:

```bash
npx wrangler d1 execute after-hours-crafts --remote --file=./migrations/0001_product_details.sql
```

For local development, run the migration without `--remote`:

```bash
npx wrangler d1 execute after-hours-crafts --local --file=./migrations/0001_product_details.sql
```

## 4. Automatic migrations

`./start-local.sh` automatically runs:

```bash
npx wrangler d1 migrations apply after-hours-crafts --local
```

before starting the local Pages server.

Production migrations run through the GitHub Actions workflow at `.github/workflows/migrate-d1.yml`. Add these repository secrets in GitHub under **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN`: an API token with **Account → D1 → Edit**
- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID

The workflow runs when migration files change on `main`, and can also be started manually from the repository's **Actions** tab. This is safer than running a remote migration on every Pages build: Pages builds should not contain a long-lived Cloudflare API token.

If you already applied `0001_product_details.sql` manually with `d1 execute`, do not run it again. Marking migrations after a manual execution requires either a fresh local database or manually reconciling the D1 migrations table.

## 5. Deploy

Push the project to GitHub. Pages will deploy the `functions/` directory along with the site. Open `/admin/` and choose **Continue with Google**.

For local development, Pages Functions and D1 need Wrangler rather than the plain Python server:

```bash
npx wrangler pages dev .
```

The simple `python3 -m http.server 8000` command still works for previewing the public, static storefront, but it cannot run the `/api` routes.

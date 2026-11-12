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

## 3. Deploy

Push the project to GitHub. Pages will deploy the `functions/` directory along with the site. Open `/admin/` and choose **Continue with Google**.

For local development, Pages Functions and D1 need Wrangler rather than the plain Python server:

```bash
npx wrangler pages dev .
```

The simple `python3 -m http.server 8000` command still works for previewing the public, static storefront, but it cannot run the `/api` routes.

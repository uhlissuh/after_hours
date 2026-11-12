import { cookie, redirect } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const state = crypto.randomUUID();
  const url = new URL(request.url);
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    state
  });
  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, {
    "Set-Cookie": cookie("ah_oauth_state", state, 600, url.protocol === "https:")
  });
}

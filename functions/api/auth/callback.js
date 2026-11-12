import { cookie, redirect } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url), code = url.searchParams.get("code");
  const state = url.searchParams.get("state"), cookies = request.headers.get("Cookie") || "";
  const expected = cookies.match(/ah_oauth_state=([^;]+)/)?.[1];
  if (!code || !state || state !== expected) return new Response("Invalid sign-in request", { status: 400 });
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method:"POST", headers:{"content-type":"application/x-www-form-urlencoded"}, body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:`${url.origin}/api/auth/callback`,grant_type:"authorization_code"}) });
  if (!tokenResponse.ok) return new Response("Google sign-in failed", { status: 502 });
  const token = await tokenResponse.json();
  const profile = await (await fetch("https://www.googleapis.com/oauth2/v2/userinfo",{headers:{Authorization:`Bearer ${token.access_token}`}})).json();
  if (profile.email?.toLowerCase() !== "alissasobo@gmail.com") return new Response("This Google account is not authorized.", { status: 403 });
  const session = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO sessions (token,email,expires_at) VALUES (?,?,?)").bind(session, profile.email, Date.now()+604800000).run();
  return redirect("/admin/", {"Set-Cookie": cookie("ah_session", session, 604800)});
}

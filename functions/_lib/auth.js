export async function getSession(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.match(/ah_session=([^;]+)/)?.[1];
  if (!token || !env.DB) return null;
  return env.DB.prepare("SELECT email FROM sessions WHERE token = ? AND expires_at > ?")
    .bind(token, Date.now()).first();
}

export function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function redirect(url, headers = {}) {
  return new Response(null, { status: 302, headers: { Location: url, ...headers } });
}

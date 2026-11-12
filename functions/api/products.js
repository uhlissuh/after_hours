import { getSession } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  if (new URL(request.url).searchParams.get("admin") === "1" && !session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await env.DB.prepare("SELECT * FROM products ORDER BY id").all();
  return Response.json(result.results);
}

export async function onRequestPatch({ request, env }) {
  if (!await getSession(request, env)) return new Response("Unauthorized", { status: 401 });
  const updates = await request.json();
  for (const item of updates) await env.DB.prepare("UPDATE products SET stock = ? WHERE id = ?").bind(Math.max(0, item.stock), item.id).run();
  return Response.json({ ok: true });
}

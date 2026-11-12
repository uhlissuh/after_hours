import { getSession } from "../_lib/auth.js";

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

export async function onRequestPost({ request, env }) {
  if (!await getSession(request, env)) return new Response("Unauthorized", { status: 401 });
  const item = await request.json();
  if (!item.name || !item.category || !Number.isFinite(Number(item.price)) || !Number.isFinite(Number(item.stock))) {
    return new Response("Product name, category, price, and stock are required", { status: 400 });
  }
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO products (id,name,category,price,stock,color,tilt) VALUES (?,?,?,?,?,?,?)")
    .bind(id, item.name.trim(), item.category, Math.max(0, Number(item.price)), Math.max(0, Number(item.stock)), "#5267d6", "0deg").run();
  return Response.json({ id }, { status: 201 });
}

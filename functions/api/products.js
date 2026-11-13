import { getSession } from "../_lib/auth.js";

const PRODUCT_CATEGORIES = new Set(["accessories", "clothing", "home-decor"]);

function isValidProduct(item) {
  return item?.name && PRODUCT_CATEGORIES.has(item.category) &&
    Number.isFinite(Number(item.price)) && Number.isFinite(Number(item.stock));
}

function photoKeys(photos) {
  return photos.map(photo => {
    try {
      const url = new URL(photo);
      return url.pathname === "/api/uploads" ? url.searchParams.get("key") : null;
    } catch {
      return null;
    }
  }).filter(key => key?.startsWith("products/"));
}

export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  if (new URL(request.url).searchParams.get("admin") === "1" && !session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await env.DB.prepare("SELECT * FROM products ORDER BY id").all();
  return Response.json(result.results.map(product => ({ ...product, photos: JSON.parse(product.photos || "[]") })));
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
  if (!isValidProduct(item)) {
    return new Response("Product name, category, price, and stock are required", { status: 400 });
  }
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO products (id,name,category,price,stock,color,tilt,description,photos) VALUES (?,?,?,?,?,?,?,?,?)")
    .bind(id, item.name.trim(), item.category, Math.max(0, Number(item.price)), Math.max(0, Number(item.stock)), "#5267d6", "0deg", item.description || "", JSON.stringify(Array.isArray(item.photos) ? item.photos : [])).run();
  return Response.json({ id }, { status: 201 });
}

export async function onRequestPut({ request, env }) {
  if (!await getSession(request, env)) return new Response("Unauthorized", { status: 401 });
  const item = await request.json();
  if (!item.id) return new Response("Product id is required", { status: 400 });
  if (!isValidProduct(item)) {
    return new Response("Product name, category, price, and stock are required", { status: 400 });
  }

  const current = await env.DB.prepare("SELECT photos FROM products WHERE id = ?").bind(item.id).first();
  if (!current) return new Response("Product not found", { status: 404 });

  const photos = Array.isArray(item.photos) ? item.photos : [];
  await env.DB.prepare(
    "UPDATE products SET name = ?, category = ?, price = ?, stock = ?, description = ?, photos = ? WHERE id = ?"
  ).bind(
    item.name.trim(),
    item.category,
    Math.max(0, Number(item.price)),
    Math.max(0, Number(item.stock)),
    item.description || "",
    JSON.stringify(photos),
    item.id
  ).run();

  const removedKeys = photoKeys(JSON.parse(current.photos || "[]").filter(photo => !photos.includes(photo)));
  if (removedKeys.length && env.IMAGES) {
    try {
      await env.IMAGES.delete(removedKeys);
    } catch (error) {
      console.error("Product updated, but removed R2 photos could not be deleted", error);
    }
  }

  return Response.json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  if (!await getSession(request, env)) return new Response("Unauthorized", { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new Response("Product id is required", { status: 400 });

  const product = await env.DB.prepare("SELECT photos FROM products WHERE id = ?").bind(id).first();
  if (!product) return new Response("Product not found", { status: 404 });

  const keys = photoKeys(JSON.parse(product.photos || "[]"));
  await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  if (keys.length && env.IMAGES) {
    try {
      await env.IMAGES.delete(keys);
    } catch (error) {
      console.error("Product removed, but its R2 photos could not be deleted", error);
    }
  }

  return Response.json({ ok: true });
}

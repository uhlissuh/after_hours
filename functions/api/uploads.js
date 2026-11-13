import { getSession } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!await getSession(request, env)) return new Response("Unauthorized", { status: 401 });
  if (!env.IMAGES) {
    return new Response("Photo storage is not connected. Add the IMAGES R2 binding in Cloudflare.", { status: 503 });
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function") return new Response("An image file is required", { status: 400 });
  if (!file.type.startsWith("image/")) return new Response("Only image files are supported", { status: 415 });
  if (file.size > 10 * 1024 * 1024) return new Response("Images must be smaller than 10 MB", { status: 413 });
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const key = `products/${crypto.randomUUID()}.${extension}`;
  try {
    await env.IMAGES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  } catch (error) {
    console.error("R2 product photo upload failed", error);
    return new Response("Cloudflare could not store this photo. Check the IMAGES R2 binding and try again.", { status: 502 });
  }
  const url = new URL(request.url);
  return Response.json({ key, url: `${url.origin}/api/uploads?key=${encodeURIComponent(key)}` });
}

export async function onRequestGet({ request, env }) {
  if (!env.IMAGES) return new Response("Photo storage is not connected", { status: 503 });
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !key.startsWith("products/")) return new Response("Not found", { status: 404 });
  const object = await env.IMAGES.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
}

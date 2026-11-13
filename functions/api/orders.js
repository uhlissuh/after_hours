import { getSession } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  if (!await getSession(request, env)) return new Response("Unauthorized", { status: 401 });

  const orders = await env.DB.prepare("SELECT * FROM orders WHERE status = 'paid' ORDER BY paid_at DESC").all();
  const items = await env.DB.prepare(
    "SELECT order_id, product_id, product_name, unit_price_cents, quantity FROM order_items ORDER BY product_name"
  ).all();
  const itemsByOrder = new Map();
  for (const item of items.results) {
    if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
    itemsByOrder.get(item.order_id).push(item);
  }

  return Response.json(orders.results.map(order => ({
    ...order,
    items: itemsByOrder.get(order.id) || []
  })));
}

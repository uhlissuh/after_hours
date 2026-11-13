function hex(buffer) {
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function equalSignatures(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function verifyStripeSignature(body, signatureHeader, secret) {
  const parts = signatureHeader.split(",").map(part => part.split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`)));
  return signatures.some(signature => equalSignatures(signature, expected));
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_WEBHOOK_SECRET) return new Response("Webhook secret is not configured", { status: 503 });
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET)) {
    return new Response("Invalid Stripe signature", { status: 400 });
  }

  const event = JSON.parse(body);
  if (event.type !== "checkout.session.completed") return Response.json({ received: true });

  const session = event.data.object;
  const orderId = session.metadata?.order_id;
  if (!orderId || session.payment_status !== "paid") return Response.json({ received: true });

  const order = await env.DB.prepare("SELECT status FROM orders WHERE id = ?").bind(orderId).first();
  if (!order || order.status === "paid") return Response.json({ received: true });

  const shipping = session.collected_information?.shipping_details || session.shipping_details;
  const address = shipping?.address || session.customer_details?.address || {};
  const updated = await env.DB.prepare(
    `UPDATE orders SET
      status = 'paid',
      stripe_session_id = ?,
      stripe_payment_intent_id = ?,
      customer_name = ?,
      customer_email = ?,
      address_line1 = ?,
      address_line2 = ?,
      address_city = ?,
      address_state = ?,
      address_postal_code = ?,
      address_country = ?,
      total_cents = ?,
      paid_at = ?
    WHERE id = ? AND status = 'pending'`
  ).bind(
    session.id,
    session.payment_intent || null,
    shipping?.name || session.customer_details?.name || "",
    session.customer_details?.email || session.customer_email || "",
    address.line1 || "",
    address.line2 || "",
    address.city || "",
    address.state || "",
    address.postal_code || "",
    address.country || "US",
    session.amount_total,
    Date.now(),
    orderId
  ).run();

  if (updated.meta.changes) {
    const items = await env.DB.prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?").bind(orderId).all();
    await env.DB.batch(items.results.map(item =>
      env.DB.prepare("UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?").bind(item.quantity, item.product_id)
    ));
  }

  return Response.json({ received: true });
}

function stripeErrorMessage(payload) {
  return payload?.error?.message || "Stripe could not start checkout";
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) {
    return new Response("Stripe checkout has not been configured yet", { status: 503 });
  }

  const payload = await request.json().catch(() => null);
  if (!Array.isArray(payload?.items) || payload.items.length === 0) {
    return new Response("Your bag is empty", { status: 400 });
  }

  const quantities = new Map();
  for (const item of payload.items) {
    const quantity = Number(item.quantity);
    if (!item.id || !Number.isInteger(quantity) || quantity < 1 || quantity > 25) {
      return new Response("Invalid bag item", { status: 400 });
    }
    quantities.set(String(item.id), (quantities.get(String(item.id)) || 0) + quantity);
  }

  const products = [];
  for (const [id, quantity] of quantities) {
    const product = await env.DB.prepare("SELECT id, name, price, stock FROM products WHERE id = ?").bind(id).first();
    if (!product) return new Response("A product in your bag is no longer available", { status: 409 });
    if (product.stock < quantity) {
      return new Response(`Only ${product.stock} of ${product.name} are available`, { status: 409 });
    }
    products.push({ ...product, quantity, unitPriceCents: Math.round(Number(product.price) * 100) });
  }

  const orderId = crypto.randomUUID();
  const subtotalCents = products.reduce((sum, product) => sum + product.unitPriceCents * product.quantity, 0);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO orders (id, status, subtotal_cents, created_at) VALUES (?, 'pending', ?, ?)")
      .bind(orderId, subtotalCents, Date.now()),
    ...products.map(product => env.DB.prepare(
      "INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity) VALUES (?, ?, ?, ?, ?)"
    ).bind(orderId, product.id, product.name, product.unitPriceCents, product.quantity))
  ]);

  const origin = new URL(request.url).origin;
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${origin}/?checkout=success`);
  form.set("cancel_url", `${origin}/?checkout=cancel`);
  form.set("shipping_address_collection[allowed_countries][0]", "US");
  form.set("metadata[order_id]", orderId);
  products.forEach((product, index) => {
    form.set(`line_items[${index}][price_data][currency]`, "usd");
    form.set(`line_items[${index}][price_data][unit_amount]`, String(product.unitPriceCents));
    form.set(`line_items[${index}][price_data][product_data][name]`, product.name);
    form.set(`line_items[${index}][quantity]`, String(product.quantity));
  });

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: form
  });
  const session = await stripeResponse.json();
  if (!stripeResponse.ok) {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM order_items WHERE order_id = ?").bind(orderId),
      env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(orderId)
    ]);
    return new Response(stripeErrorMessage(session), { status: 502 });
  }

  await env.DB.prepare("UPDATE orders SET stripe_session_id = ? WHERE id = ?").bind(session.id, orderId).run();
  return Response.json({ url: session.url });
}

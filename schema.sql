CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL,
  tilt TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  photos TEXT NOT NULL DEFAULT '[]'
);

INSERT OR IGNORE INTO products (id,name,category,price,stock,color,tilt) VALUES
('1','Patchwork market tote','accessories',48,8,'#ef725f','-8deg'),
('2','Sunday table runner','home-decor',62,4,'#5267d6','9deg'),
('3','Pocket-sized pincushion','accessories',18,12,'#dce64b','-3deg'),
('4','The everyday bucket hat','clothing',54,6,'#c98f70','8deg');

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_name TEXT,
  customer_email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  subtotal_cents INTEGER NOT NULL,
  total_cents INTEGER,
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);

CREATE TABLE IF NOT EXISTS order_items (
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

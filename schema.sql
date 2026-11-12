CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL,
  tilt TEXT NOT NULL
);

INSERT OR IGNORE INTO products (id,name,category,price,stock,color,tilt) VALUES
('1','Patchwork market tote','wear',48,8,'#ef725f','-8deg'),
('2','Sunday table runner','home',62,4,'#5267d6','9deg'),
('3','Pocket-sized pincushion','gifts',18,12,'#dce64b','-3deg'),
('4','The everyday bucket hat','wear',54,6,'#c98f70','8deg');

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const NEWSLETTER_FILE = path.join(DATA_DIR, 'newsletter.json');

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

function readJson(file, fallback = []) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, value) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}
function validEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

// API status
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Aurelia Perfume API', timestamp: new Date().toISOString() });
});

// Product catalogue with optional category, search, sort and product detail endpoints
app.get('/api/products', (req, res) => {
  let products = readJson(PRODUCTS_FILE);
  const { category, search, sort } = req.query;
  if (category && category !== 'all') products = products.filter(p => p.cat === String(category).toLowerCase());
  if (search) {
    const q = String(search).toLowerCase();
    products = products.filter(p => [p.name, p.notes, p.desc, p.cat].join(' ').toLowerCase().includes(q));
  }
  if (sort === 'low') products.sort((a, b) => a.price - b.price);
  if (sort === 'high') products.sort((a, b) => b.price - a.price);
  if (sort === 'name') products.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ count: products.length, products });
});
app.get('/api/products/:id', (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const product = products.find(p => String(p.id) === req.params.id || p.name.toLowerCase() === req.params.id.toLowerCase());
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});

// Newsletter signup stores only the email address; do not use real customer data in this demo.
app.post('/api/newsletter', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  const entries = readJson(NEWSLETTER_FILE);
  if (entries.some(entry => entry.email === email)) return res.status(409).json({ error: 'This email is already subscribed.' });
  entries.push({ email, createdAt: new Date().toISOString() });
  writeJson(NEWSLETTER_FILE, entries);
  res.status(201).json({ message: 'Thanks for subscribing to Aurelia updates.' });
});

// Demo order endpoint: stores cart lines only, no payment or shipping details.
app.post('/api/orders', (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return res.status(400).json({ error: 'Provide at least one cart item.' });
  }
  const products = readJson(PRODUCTS_FILE);
  const orderItems = [];
  for (const item of items) {
    const product = products.find(p => p.id === Number(item.productId));
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({ error: 'One or more cart items are invalid.' });
    }
    orderItems.push({ productId: product.id, name: product.name, unitPrice: product.price, quantity, lineTotal: product.price * quantity });
  }
  const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const orders = readJson(ORDERS_FILE);
  const order = { orderId: `AUR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, items: orderItems, total, status: 'DEMO_ONLY', createdAt: new Date().toISOString() };
  orders.push(order);
  writeJson(ORDERS_FILE, orders);
  res.status(201).json({ message: 'Demo order preview saved. No payment was taken.', order });
});

// Frontend is served by this same Express app.
app.use(express.static(path.join(ROOT, '..', 'frontend')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(ROOT, '..', 'frontend', 'index.html'));
});
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => console.log(`Aurelia running at http://localhost:${PORT}`));

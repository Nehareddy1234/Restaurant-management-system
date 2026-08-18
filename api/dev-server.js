// api/dev-server.js
// Local development API server using Fastify + Prisma + Supabase PostgreSQL
// Run with: npm run server (starts on port 3000)

import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config(); // Load .env

const prisma = new PrismaClient();
const app = Fastify({ logger: { level: 'warn' } });

// ─── CORS helper ──────────────────────────────────────────────────────────────
app.addHook('onSend', async (req, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
});
app.options('*', async (req, reply) => { reply.code(204).send(); });

// ─── Utility ───────────────────────────────────────────────────────────────────
const IST = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true };
const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', IST).toUpperCase();

const mapOrder = (o) => ({
  ...o,
  table: o.tableId ? `Table ${o.table?.name || o.tableId}` : 'Takeaway',
  time: formatTime(o.createdAt),
  itemList: (o.items || []).map(i => {
    let name = i.menuItem?.name || String(i.menuItemId);
    const ao = i.addOns || {};
    const parts = [];
    if (ao.Roti && ao.Roti !== 0) parts.push(`${ao.Roti > 0 ? '+' : ''}${ao.Roti} Roti`);
    if (ao.Curry && ao.Curry !== 0) parts.push(`${ao.Curry > 0 ? '+' : ''}${ao.Curry} Curry`);
    if (parts.length) name += ` (${parts.join(', ')})`;
    return `${name} x${i.quantity}`;
  }),
});

// ─── Daily order number ────────────────────────────────────────────────────────
async function getNextOrderNumber(date) {
  const seq = await prisma.orderDailySequence.upsert({
    where: { date },
    update: { lastNumber: { increment: 1 } },
    create: { date, lastNumber: 1 },
  });
  return seq.lastNumber;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENU
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/menu', async () => prisma.menuItem.findMany({ orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }] }));

app.post('/api/menu', async (req, reply) => {
  const { name, category, price, enabled = true, availableOnline = true, image, orderIndex = 0 } = req.body;
  const item = await prisma.menuItem.create({ data: { name, category, price, enabled, availableOnline, image, orderIndex } });
  return reply.code(201).send(item);
});

app.put('/api/menu/:id', async (req) => {
  const id = Number(req.params.id);
  return prisma.menuItem.update({ where: { id }, data: req.body });
});

app.delete('/api/menu/:id', async (req, reply) => {
  await prisma.menuItem.delete({ where: { id: Number(req.params.id) } });
  return reply.code(204).send();
});

// ─── Menu categories ───────────────────────────────────────────────────────────
app.get('/api/menu-categories', async () => prisma.menuCategory.findMany({ orderBy: { id: 'asc' } }));

app.post('/api/menu-categories', async (req, reply) => {
  const cat = await prisma.menuCategory.create({ data: { name: req.body.name } });
  return reply.code(201).send(cat);
});

app.delete('/api/menu-categories/:id', async (req, reply) => {
  await prisma.menuCategory.delete({ where: { id: Number(req.params.id) } });
  return reply.code(204).send();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/tables', async () => prisma.table.findMany({ orderBy: { id: 'asc' } }));

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/orders', async () => {
  const orders = await prisma.order.findMany({
    include: { items: { include: { menuItem: true } }, table: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return orders.map(mapOrder);
});

app.post('/api/orders', async (req, reply) => {
  const { tableId, paymentMethod = 'Cash', customerName, items, parcelCharge = 0 } = req.body;
  if (!items?.length) return reply.code(400).send({ error: 'No items provided' });

  const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const orderNumber = await getNextOrderNumber(dateStr);

  const menuIds = [...new Set(items.map(i => i.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuIds } } });
  const menuMap = Object.fromEntries(menuItems.map(m => [m.id, m]));

  const addOnTotal = (item) => ((item.addOns?.Roti || 0) * 15) + ((item.addOns?.Curry || 0) * 40);
  const subTotal = items.reduce((sum, i) => {
    const price = i.price ?? menuMap[i.menuItemId]?.price ?? 0;
    return sum + (price + addOnTotal(i)) * i.quantity;
  }, 0);
  const total = subTotal + (parcelCharge || 0);

  const order = await prisma.order.create({
    data: {
      tableId: tableId || null,
      total,
      status: 'Preparing',
      orderNumber,
      orderDate: dateStr,
      paymentMethod,
      paymentStatus: 'Pending',
      customerName: customerName || null,
      items: {
        create: items.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          addOns: i.addOns || null,
        })),
      },
    },
    include: { items: { include: { menuItem: true } }, table: true },
  });

  return reply.code(201).send(mapOrder(order));
});

app.patch('/api/orders/:id', async (req) => {
  const { id } = req.params;
  const { status, paymentMethod, paymentStatus, items } = req.body;
  const data = {};
  if (status !== undefined) data.status = status;
  if (paymentMethod !== undefined) data.paymentMethod = paymentMethod;
  if (paymentStatus !== undefined) data.paymentStatus = paymentStatus;
  if (status === 'Paid' || paymentStatus === 'Paid') data.paidAt = new Date();

  if (items?.length) {
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    data.items = {
      create: items.map(i => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        addOns: i.addOns || null,
      })),
    };

    const menuIds = [...new Set(items.map(i => i.menuItemId))];
    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuIds } } });
    const menuMap = Object.fromEntries(menuItems.map(m => [m.id, m]));
    const addOnTotal = (i) => ((i.addOns?.Roti || 0) * 15) + ((i.addOns?.Curry || 0) * 40);
    data.total = items.reduce((sum, i) => {
      const price = i.price ?? menuMap[i.menuItemId]?.price ?? 0;
      return sum + (price + addOnTotal(i)) * i.quantity;
    }, 0);
  }

  const order = await prisma.order.update({
    where: { id },
    data,
    include: { items: { include: { menuItem: true } }, table: true },
  });
  return mapOrder(order);
});

app.delete('/api/orders/:id', async (req, reply) => {
  await prisma.orderItem.deleteMany({ where: { orderId: req.params.id } });
  await prisma.order.delete({ where: { id: req.params.id } });
  return reply.code(204).send();
});

// ═══════════════════════════════════════════════════════════════════════════════
// GROCERY
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/grocery', async () => prisma.groceryItem.findMany({ orderBy: { id: 'asc' } }));

app.post('/api/grocery', async (req, reply) => {
  const item = await prisma.groceryItem.create({ data: req.body });
  return reply.code(201).send(item);
});

app.patch('/api/grocery/:id', async (req) =>
  prisma.groceryItem.update({ where: { id: Number(req.params.id) }, data: req.body })
);

app.delete('/api/grocery/:id', async (req, reply) => {
  await prisma.groceryItem.delete({ where: { id: Number(req.params.id) } });
  return reply.code(204).send();
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/expenses', async (req) => {
  const { from, to, category } = req.query;
  const where = {};
  if (from || to) where.date = {};
  if (from) where.date.gte = new Date(from);
  if (to) where.date.lte = new Date(to);
  if (category) where.category = category;
  return prisma.expense.findMany({ where, orderBy: { date: 'desc' }, take: 1000 });
});

app.post('/api/expenses', async (req, reply) => {
  const { description, category, amount, date } = req.body;
  const exp = await prisma.expense.create({
    data: { description, category, amount: Number(amount), date: new Date(date) }
  });
  return reply.code(201).send(exp);
});

app.put('/api/expenses/:id', async (req) => {
  const { description, category, amount, date } = req.body;
  return prisma.expense.update({
    where: { id: Number(req.params.id) },
    data: { description, category, amount: Number(amount), date: new Date(date) }
  });
});

app.delete('/api/expenses/:id', async (req, reply) => {
  await prisma.expense.delete({ where: { id: Number(req.params.id) } });
  return reply.code(204).send();
});

// ═══════════════════════════════════════════════════════════════════════════════
// STORE – Inventory (Products)
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/store-products', async () => prisma.storeProduct.findMany({ orderBy: { name: 'asc' } }));

app.post('/api/store-products', async (req, reply) => {
  const prod = await prisma.storeProduct.create({ data: req.body });
  return reply.code(201).send(prod);
});

app.put('/api/store-products/:id', async (req) =>
  prisma.storeProduct.update({ where: { id: req.params.id }, data: req.body })
);

app.delete('/api/store-products/:id', async (req, reply) => {
  await prisma.storeProduct.delete({ where: { id: req.params.id } });
  return reply.code(204).send();
});

// ═══════════════════════════════════════════════════════════════════════════════
// STORE – Orders (sales to customers)
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/store-orders', async () =>
  prisma.storeOrder.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { orderDate: 'desc' },
    take: 500,
  })
);

app.post('/api/store-orders', async (req, reply) => {
  const { orderNumber, totalAmount, paymentMethod, items } = req.body;
  const order = await prisma.storeOrder.create({
    data: {
      orderNumber,
      totalAmount,
      paymentMethod,
      items: {
        create: items.map(i => ({
          productId: i.productId ?? i.id,
          quantity: i.quantity,
          price: i.price,
          buyingCost: i.buyingCost ?? 0,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  // Decrement stock
  for (const i of items) {
    const pid = i.productId ?? i.id;
    await prisma.storeProduct.update({
      where: { id: pid },
      data: { stock: { decrement: i.quantity } },
    }).catch(() => {});
  }

  return reply.code(201).send(order);
});

// ═══════════════════════════════════════════════════════════════════════════════
// STORE – Supplier Orders
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/supplier-orders', async () =>
  prisma.supplierOrder.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { orderDate: 'desc' },
  })
);

app.post('/api/supplier-orders', async (req, reply) => {
  const { supplierName, totalAmount, paymentStatus, items } = req.body;
  const order = await prisma.supplierOrder.create({
    data: {
      supplierName,
      totalAmount,
      paymentStatus: paymentStatus ?? 'Unpaid',
      items: {
        create: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          buyingCost: i.buyingCost,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });
  return reply.code(201).send(order);
});

app.patch('/api/supplier-orders/:id', async (req) => {
  const { status, paymentStatus, receiveDate, paymentDate } = req.body;
  const data = {};
  if (status) data.status = status;
  if (paymentStatus) data.paymentStatus = paymentStatus;
  if (receiveDate) data.receiveDate = new Date(receiveDate);
  if (paymentDate) data.paymentDate = new Date(paymentDate);

  const order = await prisma.supplierOrder.update({ where: { id: req.params.id }, data });

  // When received, increment stock
  if (status === 'Received') {
    const full = await prisma.supplierOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
    for (const item of full?.items ?? []) {
      await prisma.storeProduct.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      }).catch(() => {});
    }
  }
  return order;
});

// ═══════════════════════════════════════════════════════════════════════════════
// USERS / AUTH
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/users/check', async (req, reply) => {
  const username = (req.query.username || '').trim().toLowerCase();
  if (!username) return reply.code(400).send({ error: 'username required' });
  const user = await prisma.profile.findUnique({ where: { username } });
  return { exists: !!user };
});

app.post('/api/users/login', async (req, reply) => {
  const { username, password } = req.body;
  if (!username || !password) return reply.code(400).send({ error: 'username and password required' });

  const user = await prisma.profile.findUnique({ where: { username: username.toLowerCase() } });
  if (!user || user.password !== password) {
    return reply.code(401).send({ error: 'Invalid username or password.' });
  }
  const { password: _pw, ...safe } = user;
  return safe;
});

app.post('/api/users/register', async (req, reply) => {
  const { username, password, displayName, role, phone, address } = req.body;
  if (!username || !password) return reply.code(400).send({ error: 'username and password required' });

  const exists = await prisma.profile.findUnique({ where: { username: username.toLowerCase() } });
  if (exists) return reply.code(409).send({ error: 'Username already taken.' });

  const user = await prisma.profile.create({
    data: {
      username: username.toLowerCase(),
      password,
      displayName: displayName || username,
      role: role || 'waiter',
      phone: phone || null,
      address: address || null,
    },
  });
  const { password: _pw, ...safe } = user;
  return reply.code(201).send(safe);
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`\n✅  API server running at http://localhost:${PORT}\n`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
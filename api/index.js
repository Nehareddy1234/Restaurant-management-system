import { PrismaClient } from '@prisma/client';

/**
 * Prevent multiple Prisma instances in Vercel serverless.
 * Always store on globalThis so warm invocations reuse the
 * same client and don't exhaust the PgBouncer connection pool.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Always cache — even in production (Vercel warm instances)
globalForPrisma.prisma = prisma;

const DEFAULT_TABLES = [
  { id: 1, name: 'T1', capacity: 4, status: 'available' },
  { id: 2, name: 'T2', capacity: 2, status: 'available' },
  { id: 3, name: 'T3', capacity: 6, status: 'available' },
  { id: 4, name: 'T4', capacity: 4, status: 'available' },
  { id: 5, name: 'T5', capacity: 4, status: 'available' },
  { id: 6, name: 'T6', capacity: 6, status: 'available' },
  { id: 7, name: 'T7', capacity: 2, status: 'available' },
];

let defaultTablesReady = false;

async function ensureDefaultTables() {
  if (defaultTablesReady) return;

  await prisma.table.createMany({
    data: DEFAULT_TABLES,
    skipDuplicates: true,
  });
  defaultTablesReady = true;
}

/**
 * Helper to parse JSON body
 */
function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', chunk => {
      data += chunk;
    });

    req.on('end', () => {
      if (!data) return resolve({});

      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });

    req.on('error', err => reject(err));
  });
}

/**
 * Helper response function
 */
function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });

  res.end(JSON.stringify(data));
}

/**
 * Maps a DB order (with items.menuItem) into the shape the frontend expects:
 *  - orderNumber: sequential int (1, 2, 3...)
 *  - itemList: ["Thali (+1 Roti) x2", "Dal Makhani x1", ...]  (string array)
 *  - table:    "Table T1"  (string, or "Takeaway")
 *  - time:     "DD MMM, HH:MM AM/PM" in IST
 */
function mapOrder(order) {
  const itemList = (order.items || []).map(oi => {
    let name = oi.menuItem?.name || `Item #${oi.menuItemId}`;
    const addOns = oi.addOns || {};
    const addOnParts = [];
    if (addOns.Roti && addOns.Roti !== 0) addOnParts.push(`${addOns.Roti > 0 ? '+' : ''}${addOns.Roti} Roti`);
    if (addOns.Curry && addOns.Curry !== 0) addOnParts.push(`${addOns.Curry > 0 ? '+' : ''}${addOns.Curry} Curry`);
    if (addOnParts.length) name += ` (${addOnParts.join(', ')})`;
    return `${name} x${oi.quantity}`;
  });

  const tableStr = order.table ? `Table ${order.table.name}` : 'Takeaway';

  const d = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateOptions = { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' };
  const timeOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true };
  const dateStr = d.toLocaleDateString('en-IN', dateOptions);
  const timeStr = d.toLocaleTimeString('en-IN', timeOptions);
  const time = `${dateStr}, ${timeStr.toUpperCase()}`;

  const closedDate = order.paidAt ? new Date(order.paidAt) : d;
  const closedAt = closedDate.toLocaleTimeString('en-IN', timeOptions).toUpperCase();
  const date = closedDate.toLocaleDateString('en-IN', dateOptions);

  return {
    ...order,
    orderNumber: order.orderNumber ?? null,  // explicit — never lost in spread
    itemList,
    table: tableStr,
    time,
    date,
    closedAt,
  };
}

/**
 * Maps a DB table (with orders.items.menuItem) into the shape the frontend expects:
 *  - order: the latest active order (already mapped), or null
 */
function mapTable(table) {
  const activeOrder = (table.orders || []).find(o => o.status !== 'Paid') || null;
  return {
    ...table,
    orders: undefined,  // remove raw array — frontend uses `order` (singular)
    order: activeOrder ? mapOrder(activeOrder) : null,
  };
}

/**
 * Calculates the total for a list of cart items, including add-on pricing.
 * cartItems: [{ menuItemId, quantity, addOns, price }]
 */
function calcTotal(cartItems) {
  return Math.round(
    cartItems.reduce((sum, ci) => {
      const addOnCost = ((ci.addOns?.Roti || 0) * 15) + ((ci.addOns?.Curry || 0) * 40);
      return sum + (ci.price + addOnCost) * ci.quantity;
    }, 0)
  );
}

function normalizePaymentMethod(paymentMethod) {
  return ['Cash', 'UPI', 'Card'].includes(paymentMethod) ? paymentMethod : 'Cash';
}

function parseExpenseDate(value) {
  const raw = value || new Date().toISOString().slice(0, 10);
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid expense date');
  }
  return date;
}

function parseOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Order must include at least one item');
  }

  return items.map(item => {
    const menuItemId = Number.parseInt(item.menuItemId, 10);
    const quantity = Number.parseInt(item.quantity, 10);
    const price = Number(item.price);

    if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
      throw new Error('Invalid menu item in order');
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Invalid item quantity in order');
    }

    return {
      menuItemId,
      quantity,
      price: Number.isFinite(price) && price >= 0 ? price : null,
      addOns: item.addOns || null,
    };
  });
}

async function enrichCartItems(cartItems) {
  const missingPriceIds = cartItems
    .filter(item => item.price === null)
    .map(item => item.menuItemId);

  if (missingPriceIds.length === 0) {
    return cartItems;
  }

  const menuItemRecords = await prisma.menuItem.findMany({
    where: { id: { in: [...new Set(missingPriceIds)] } },
    select: { id: true, price: true },
  });
  const priceMap = Object.fromEntries(menuItemRecords.map(m => [m.id, m.price]));

  return cartItems.map(item => ({
    ...item,
    price: item.price ?? priceMap[item.menuItemId] ?? 0,
  }));
}

/**
 * Main API handler
 */
export default async function handler(req, res) {
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  try {
    const url = req.url || '';
    const method = req.method;
    const path = url.split('?')[0];

    /**
     * =========================================================
     * USERS (Supabase Authentication & Registration)
     * =========================================================
     */
    if (path.startsWith('/api/users')) {
      const subPath = path.replace('/api/users', '');

      /**
       * POST /api/users/register
       */
      if (subPath === '/register' && method === 'POST') {
        const body = await getJsonBody(req);
        const { username, password, displayName, role, phone, address } = body;

        if (!username || !password) {
          return send(res, 400, { error: 'Username and password are required' });
        }

        // Check if username (email in Profile) already exists
        const exists = await prisma.profile.findUnique({
          where: { email: username.trim().toLowerCase() }
        });

        if (exists) {
          return send(res, 400, { error: 'Username already taken' });
        }

        const created = await prisma.profile.create({
          data: {
            email: username.trim().toLowerCase(),
            password: password,
            role: role || 'waiter',
            displayName: displayName.trim() || username.trim(),
            phone: phone || '',
            address: address || '',
            avatar: (displayName.trim() || username.trim()).slice(0, 2).toUpperCase()
          }
        });

        const { password: _pw, ...safeUser } = created;
        const mappedUser = {
          ...safeUser,
          username: safeUser.email
        };
        return send(res, 201, mappedUser);
      }

      /**
       * POST /api/users/login
       */
      if (subPath === '/login' && method === 'POST') {
        const body = await getJsonBody(req);
        const { username, password } = body;

        if (!username || !password) {
          return send(res, 400, { error: 'Username and password are required' });
        }

        const user = await prisma.profile.findUnique({
          where: { email: username.trim().toLowerCase() }
        });

        if (user && user.password === password) {
          const { password: _pw, ...safeUser } = user;
          const mappedUser = {
            ...safeUser,
            username: safeUser.email
          };
          return send(res, 200, mappedUser);
        }

        return send(res, 401, { error: 'Invalid username or password' });
      }

      /**
       * GET /api/users/check (checks username uniqueness)
       */
      if (subPath === '/check' && method === 'GET') {
        const queryParams = new URL(url, 'http://localhost').searchParams;
        const usernameQuery = queryParams.get('username') || '';

        if (!usernameQuery) {
          return send(res, 400, { error: 'Username query parameter is required' });
        }

        const user = await prisma.profile.findUnique({
          where: { email: usernameQuery.trim().toLowerCase() }
        });

        return send(res, 200, { exists: !!user });
      }

      return send(res, 405, { error: 'Method not allowed' });
    }

    /**
     * =========================================================
     * MENU
     * =========================================================
     */
    if (path.startsWith('/api/menu')) {
      const idPart = path
        .replace('/api/menu', '')
        .replace(/^\//, '');

      const id = idPart ? parseInt(idPart) : null;

      /**
       * GET MENU
       */
      if (method === 'GET') {
        if (id) {
          const item = await prisma.menuItem.findUnique({
            where: { id },
          });

          if (!item) {
            return send(res, 404, {
              error: 'Menu item not found',
            });
          }

          return send(res, 200, item);
        }

        const items = await prisma.menuItem.findMany({
          orderBy: {
            id: 'asc',
          },
        });

        return send(res, 200, items);
      }

      /**
       * CREATE MENU ITEM
       */
      if (method === 'POST') {
        const body = await getJsonBody(req);

        const created = await prisma.menuItem.create({
          data: {
            name: body.name,
            category: body.category,
            price: body.price,
            image: body.image || null,
            enabled: true,
          },
        });

        return send(res, 201, created);
      }

      /**
       * UPDATE MENU ITEM
       */
      if (method === 'PUT' && id) {
        const body = await getJsonBody(req);

        const updated = await prisma.menuItem.update({
          where: { id },
          data: {
            name: body.name !== undefined ? body.name : undefined,
            category: body.category !== undefined ? body.category : undefined,
            price: body.price !== undefined ? body.price : undefined,
            image: body.image !== undefined ? body.image : undefined,
            enabled: body.enabled !== undefined ? body.enabled : undefined,
          },
        });

        return send(res, 200, updated);
      }

      /**
       * DELETE MENU ITEM (hard delete, cascade order items first)
       */
      if (method === 'DELETE' && id) {
        // Delete related order items first to avoid foreign key violations
        await prisma.orderItem.deleteMany({
          where: { menuItemId: id },
        });

        const deleted = await prisma.menuItem.delete({
          where: { id },
        });

        return send(res, 200, deleted);
      }

      return send(res, 405, {
        error: 'Method not allowed',
      });
    }

    /**
     * =========================================================
     * TABLES
     * =========================================================
     */
    if (path.startsWith('/api/tables')) {
      const idPart = path
        .replace('/api/tables', '')
        .replace(/^\//, '');

      const id = idPart ? parseInt(idPart) : null;

      // Include nested order items + menuItem so mapOrder can build itemList
      const tableInclude = {
        orders: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
            table: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      };

      if (method === 'GET') {
        await ensureDefaultTables();

        if (id) {
          const table = await prisma.table.findUnique({
            where: { id },
            include: tableInclude,
          });

          if (!table) {
            return send(res, 404, {
              error: 'Table not found',
            });
          }

          return send(res, 200, mapTable(table));
        }

        const tables = await prisma.table.findMany({
          include: tableInclude,
          orderBy: {
            id: 'asc',
          },
        });

        return send(res, 200, tables.map(mapTable));
      }

      if (method === 'PUT' && id) {
        const body = await getJsonBody(req);

        const updated = await prisma.table.update({
          where: { id },
          data: {
            status: body.status,
          },
        });

        return send(res, 200, updated);
      }

      return send(res, 405, {
        error: 'Method not allowed',
      });
    }

    /**
     * =========================================================
     * GROCERY
     * =========================================================
     */
    if (path.startsWith('/api/grocery')) {
      const idPart = path
        .replace('/api/grocery', '')
        .replace(/^\//, '');

      const id = idPart ? parseInt(idPart) : null;

      if (method === 'GET') {
        if (id) {
          const item = await prisma.groceryItem.findUnique({
            where: { id },
          });

          if (!item) {
            return send(res, 404, {
              error: 'Grocery item not found',
            });
          }

          return send(res, 200, item);
        }

        const items = await prisma.groceryItem.findMany({
          orderBy: {
            id: 'asc',
          },
        });

        return send(res, 200, items);
      }

      if (method === 'POST') {
        const body = await getJsonBody(req);

        const created = await prisma.groceryItem.create({
          data: {
            name: body.name,
            quantity: parseFloat(body.quantity),
            unit: body.unit,
            purchased: false,
          },
        });

        return send(res, 201, created);
      }

      if (method === 'PUT' && id) {
        const body = await getJsonBody(req);

        const updated = await prisma.groceryItem.update({
          where: { id },
          data: {
            name: body.name !== undefined ? body.name : undefined,
            quantity: body.quantity !== undefined ? parseFloat(body.quantity) : undefined,
            unit: body.unit !== undefined ? body.unit : undefined,
            purchased: body.purchased !== undefined ? body.purchased : undefined,
          },
        });

        return send(res, 200, updated);
      }

      if (method === 'DELETE' && id) {
        await prisma.groceryItem.delete({
          where: { id },
        });

        return send(res, 200, {
          success: true,
        });
      }

      return send(res, 405, {
        error: 'Method not allowed',
      });
    }

    /**
     * =========================================================
     * EXPENSES
     * =========================================================
     */
    if (path.startsWith('/api/expenses')) {
      const idPart = path
        .replace('/api/expenses', '')
        .replace(/^\//, '');

      const id = idPart ? parseInt(idPart, 10) : null;

      if (method === 'GET') {
        if (id) {
          const expense = await prisma.expense.findUnique({ where: { id } });
          if (!expense) {
            return send(res, 404, { error: 'Expense not found' });
          }
          return send(res, 200, expense);
        }

        const expenses = await prisma.expense.findMany({
          orderBy: [
            { date: 'desc' },
            { createdAt: 'desc' },
          ],
        });

        return send(res, 200, expenses);
      }

      if (method === 'POST') {
        const body = await getJsonBody(req);
        const description = body.description?.trim();
        const amount = Number(body.amount);

        if (!description) {
          return send(res, 400, { error: 'Expense description is required' });
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          return send(res, 400, { error: 'Expense amount must be greater than zero' });
        }

        const created = await prisma.expense.create({
          data: {
            description,
            category: body.category || 'Miscellaneous',
            amount,
            date: parseExpenseDate(body.date),
          },
        });

        return send(res, 201, created);
      }

      if (method === 'DELETE' && id) {
        await prisma.expense.delete({ where: { id } });
        return send(res, 200, { success: true });
      }

      return send(res, 405, {
        error: 'Method not allowed',
      });
    }

    /**
     * =========================================================
     * ORDERS
     * =========================================================
     */
    if (path.startsWith('/api/orders')) {
      const idPart = path
        .replace('/api/orders', '')
        .replace(/^\//, '');

      const id = idPart || null;

      // Always include items + menuItem + table so mapOrder works
      const orderInclude = {
        items: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      };

      if (method === 'GET') {
        if (id) {
          const order = await prisma.order.findUnique({
            where: { id },
            include: orderInclude,
          });

          if (!order) {
            return send(res, 404, {
              error: 'Order not found',
            });
          }

          return send(res, 200, mapOrder(order));
        }

        const orders = await prisma.order.findMany({
          include: orderInclude,
          orderBy: {
            createdAt: 'desc',
          },
        });

        return send(res, 200, orders.map(mapOrder));
      }

      /**
       * POST /api/orders
       * Body: { tableId?: number, items: [{ menuItemId, quantity, addOns?, price? }] }
       * We look up menu item prices, calculate total, and use Prisma nested writes.
       */
      if (method === 'POST') {
        const body = await getJsonBody(req);
        const cartItems = parseOrderItems(body.items);
        const enrichedCart = await enrichCartItems(cartItems);

        const total = calcTotal(enrichedCart);
        const tableId = body.tableId ? Number.parseInt(body.tableId, 10) : null;

        const createdWithItems = await prisma.$transaction(async (tx) => {
          const created = await tx.order.create({
            data: {
              tableId,
              total,
              status: 'Preparing',
              paymentMethod: normalizePaymentMethod(body.paymentMethod),
              items: {
                create: enrichedCart.map(ci => ({
                  menuItemId: ci.menuItemId,
                  quantity: ci.quantity,
                  addOns: ci.addOns,
                })),
              },
            },
            include: orderInclude,
          });

          if (tableId) {
            await tx.table.update({
              where: { id: tableId },
              data: { status: 'occupied' },
            });
          }

          return created;
        });

        return send(res, 201, mapOrder(createdWithItems));
      }

      /**
       * PUT /api/orders/:id
       * Body: { status?: string, tableId?: number, items?: [...] }
       * Handles both status updates and full order edits.
       */
      if (method === 'PUT' && id) {
        const body = await getJsonBody(req);

        // Simple status-only update (e.g. Preparing → Ready → Paid)
        if (body.status && !body.items) {
          const updated = await prisma.$transaction(async (tx) => {
            const order = await tx.order.update({
              where: { id },
              data: {
                status: body.status,
                paymentMethod: body.paymentMethod !== undefined ? body.paymentMethod : undefined,
                paidAt: body.status === 'Paid' ? new Date() : undefined,
              },
              include: orderInclude,
            });

            if (body.status === 'Paid' && order.tableId) {
              await tx.table.update({
                where: { id: order.tableId },
                data: { status: 'available' },
              });
            }

            return order;
          });

          return send(res, 200, mapOrder(updated));
        }

        // Full order update (items changed)
        if (body.items) {
          const cartItems = parseOrderItems(body.items);
          const enrichedCart = await enrichCartItems(cartItems);
          const total = calcTotal(enrichedCart);
          const nextTableId = body.tableId !== undefined
            ? (body.tableId ? Number.parseInt(body.tableId, 10) : null)
            : undefined;

          const updated = await prisma.$transaction(async (tx) => {
            const existing = await tx.order.findUnique({
              where: { id },
              select: { tableId: true },
            });

            await tx.orderItem.deleteMany({ where: { orderId: id } });

            const order = await tx.order.update({
              where: { id },
              data: {
                total,
                tableId: nextTableId,
                items: {
                  create: enrichedCart.map(ci => ({
                    menuItemId: ci.menuItemId,
                    quantity: ci.quantity,
                    addOns: ci.addOns,
                  })),
                },
              },
              include: orderInclude,
            });

            if (existing?.tableId && existing.tableId !== order.tableId) {
              await tx.table.update({
                where: { id: existing.tableId },
                data: { status: 'available' },
              });
            }

            if (order.tableId) {
              await tx.table.update({
                where: { id: order.tableId },
                data: { status: 'occupied' },
              });
            }

            return order;
          });

          return send(res, 200, mapOrder(updated));
        }

        // Generic update fallback
        const updated = await prisma.order.update({
          where: { id },
          data: body,
          include: orderInclude,
        });

        return send(res, 200, mapOrder(updated));
      }

      if (method === 'DELETE' && id) {
        await prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({ where: { id }, select: { tableId: true } });

          await tx.orderItem.deleteMany({ where: { orderId: id } });
          await tx.order.delete({ where: { id } });

          if (order?.tableId) {
            await tx.table.update({
              where: { id: order.tableId },
              data: { status: 'available' },
            });
          }
        });

        return send(res, 200, { success: true });
      }

      return send(res, 405, {
        error: 'Method not allowed',
      });
    }

    /**
     * =========================================================
     * 404
     * =========================================================
     */
    return send(res, 404, {
      error: 'Endpoint not found',
    });

  } catch (error) {
    console.error(error);

    if (error.code === 'P2024') {
      return send(res, 503, {
        error: 'Database is busy. Please try again in a few seconds.',
      });
    }

    if (
      error.message === 'Order must include at least one item' ||
      error.message === 'Invalid menu item in order' ||
      error.message === 'Invalid item quantity in order'
    ) {
      return send(res, 400, {
        error: error.message,
      });
    }

    return send(res, 500, {
      error: 'Internal server error',
      details: error.message,
    });
  }
}

import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });

// Initialize Prisma and Supabase clients
const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// ---- Auth hook -------------------------------------------------
fastify.addHook('preHandler', async (request, reply) => {
  const authHeader = request.headers['authorization'];
  if (!authHeader) return; // allow unauthenticated for public endpoints
  const token = authHeader.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return reply.code(401).send({ error: 'Invalid token' });
  (request as any).user = data.user;
});

// ---- Public routes -----------------------------------------------
fastify.get('/health', async () => ({ status: 'ok' }));

fastify.get('/menu', async (request, reply) => {
  const page = parseInt((request.query as any).page) || 1;
  const limit = parseInt((request.query as any).limit) || 20;
  const offset = (page - 1) * limit;
  const data = await prisma.menuItem.findMany({
    skip: offset,
    take: limit,
    select: { id: true, name: true, price: true, description: true }
  });
  const total = await prisma.menuItem.count();
  reply.headers({
    'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
    'X-Total-Count': total,
  });
  return data;
});

// ---- Protected routes (require auth) -------------------------------
fastify.post('/orders', async (request, reply) => {
  const user = (request as any).user;
  if (!user) return reply.code(401).send({ error: 'Unauthenticated' });

  const { tableId, items } = request.body as {
    tableId?: number;
    items: { menuItemId: number; quantity: number; addOns?: any }[];
  };

  // Transaction: create order, order items, update table status, compute total
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        table: tableId ? { connect: { id: tableId } } : undefined,
        status: 'Preparing',
        total: 0, // placeholder, will be updated later
        items: {
          create: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            addOns: i.addOns,
          })),
        },
      },
      include: { items: true },
    });

    // compute total with add‑on pricing (example: roti +15, curry +40)
    const detailed = await tx.orderItem.findMany({
      where: { orderId: newOrder.id },
      include: { menuItem: true },
    });
    const subtotal = detailed.reduce((sum, oi) => {
      const addOnPrice =
        ((oi.addOns?.roti ?? 0) * 15 + (oi.addOns?.curry ?? 0) * 40);
      return sum + (oi.menuItem.price + addOnPrice) * oi.quantity;
    }, 0);
    const total = Math.round(subtotal * 1.05); // 5% tax

    // update order total
    await tx.order.update({
      where: { id: newOrder.id },
      data: { total },
    });

    // mark table occupied if applicable
    if (tableId) {
      await tx.table.update({
        where: { id: tableId },
        data: { status: 'occupied', order: { connect: { id: newOrder.id } } },
      });
    }
    return { ...newOrder, total };
  });

  reply.send({ message: 'order placed', orderId: order.id, total: order.total });
});

fastify.get('/tables', async (request, reply) => {
  const page = parseInt((request.query as any).page) || 1;
  const limit = parseInt((request.query as any).limit) || 20;
  const offset = (page - 1) * limit;
  const data = await prisma.table.findMany({
    skip: offset,
    take: limit,
    include: { order: true },
    select: { id: true, status: true, order: true }
  });
  const total = await prisma.table.count();
  reply.headers({
    'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
    'X-Total-Count': total,
  });
  return data;
});

fastify.put('/tables/:id/status', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { status } = request.body as { status: string };
  const updated = await prisma.table.update({
    where: { id: Number(id) },
    data: { status },
  });
  reply.send(updated);
});

// ---- Grocery Store Routes ------------------------------------------

fastify.get('/store-products', async (request, reply) => {
  const page = parseInt((request.query as any).page) || 1;
  const limit = parseInt((request.query as any).limit) || 20;
  const offset = (page - 1) * limit;
  const data = await prisma.storeProduct.findMany({
    skip: offset,
    take: limit,
    select: { id: true, name: true, price: true, stock: true }
  });
  const total = await prisma.storeProduct.count();
  reply.headers({
    'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
    'X-Total-Count': total,
  });
  return data;
});

fastify.post('/store-products', async (request, reply) => {
  const data = request.body as any;
  const product = await prisma.storeProduct.create({ data });
  reply.send(product);
});

fastify.put('/store-products/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const data = request.body as any;
  const product = await prisma.storeProduct.update({
    where: { id },
    data
  });
  reply.send(product);
});

fastify.delete('/store-products/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  await prisma.storeProduct.delete({ where: { id } });
  reply.send({ success: true });
});

fastify.get('/store-orders', async (request, reply) => {
  const page = parseInt((request.query as any).page) || 1;
  const limit = parseInt((request.query as any).limit) || 20;
  const offset = (page - 1) * limit;
  const data = await prisma.storeOrder.findMany({
    skip: offset,
    take: limit,
    include: { items: true },
    select: { id: true, orderNumber: true, totalAmount: true, paymentMethod: true, items: true }
  });
  const total = await prisma.storeOrder.count();
  reply.headers({
    'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
    'X-Total-Count': total,
  });
  return data;
});

fastify.post('/store-orders', async (request, reply) => {
  const { items, totalAmount, paymentMethod } = request.body as any;
  
  const orderNumber = Date.now().toString().slice(-6);
  
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.storeOrder.create({
      data: {
        orderNumber,
        totalAmount,
        paymentMethod,
        items: {
          create: items.map((i: any) => ({
            productId: i.id,
            quantity: i.quantity,
            price: i.price,
            buyingCost: i.buyingCost || 0
          }))
        }
      },
      include: { items: true }
    });

    // Reduce stock
    for (const item of items) {
      await tx.storeProduct.update({
        where: { id: item.id },
        data: { stock: { decrement: item.quantity } }
      });
    }

    return newOrder;
  });

  reply.send(order);
});

fastify.get('/supplier-orders', async (request, reply) => {
  const page = parseInt((request.query as any).page) || 1;
  const limit = parseInt((request.query as any).limit) || 20;
  const offset = (page - 1) * limit;
  const data = await prisma.supplierOrder.findMany({
    skip: offset,
    take: limit,
    include: { items: true },
    select: { id: true, supplierName: true, totalAmount: true, status: true, items: true }
  });
  const total = await prisma.supplierOrder.count();
  reply.headers({
    'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
    'X-Total-Count': total,
  });
  return data;
});

fastify.post('/supplier-orders', async (request, reply) => {
  const { supplierName, totalAmount, items } = request.body as any;
  const order = await prisma.supplierOrder.create({
    data: {
      supplierName,
      totalAmount,
      items: {
        create: items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          buyingCost: i.buyingCost
        }))
      }
    },
    include: { items: true }
  });
  reply.send(order);
});

fastify.put('/supplier-orders/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { status, paymentStatus } = request.body as any;
  
  const updateData: any = {};
  if (status) {
    updateData.status = status;
    if (status === 'Received') updateData.receiveDate = new Date();
  }
  if (paymentStatus) {
    updateData.paymentStatus = paymentStatus;
    if (paymentStatus === 'Paid') updateData.paymentDate = new Date();
  }
  
  const order = await prisma.supplierOrder.update({
    where: { id },
    data: updateData,
    include: { items: true }
  });
  
  // If marked as received, update inventory stock and buying cost
  if (status === 'Received') {
    for (const item of order.items) {
      await prisma.storeProduct.update({
        where: { id: item.productId },
        data: { 
          stock: { increment: item.quantity },
          buyingCost: item.buyingCost
        }
      });
    }
  }

  reply.send(order);
});

// ---- Export for Vercel ------------------------------------------
export default async (req, res) => {
  await fastify.ready();
  return fastify.routing(req, res);
};

import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const fastify = Fastify({ logger: true });
// Initialize Prisma and Supabase clients
const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// ---- Auth hook -------------------------------------------------
fastify.addHook('preHandler', async (request, reply) => {
    const authHeader = request.headers['authorization'];
    if (!authHeader)
        return; // allow unauthenticated for public endpoints
    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    if (error)
        return reply.code(401).send({ error: 'Invalid token' });
    request.user = data.user;
});
// ---- Public routes -----------------------------------------------
fastify.get('/health', async () => ({ status: 'ok' }));
fastify.get('/menu', async (request, reply) => {
      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 20;
      const offset = (page - 1) * limit;
      const data = await prisma.menuItem.findMany({
        skip: offset,
        take: limit,
      });
      // Add simple pagination metadata
      const total = await prisma.menuItem.count();
      reply.headers({
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
        'X-Total-Count': total,
      });
      return data;
    });
// ---- Protected routes (require auth) -------------------------------
fastify.post('/orders', async (request, reply) => {
    const user = request.user;
    if (!user)
        return reply.code(401).send({ error: 'Unauthenticated' });
    const { tableId, items } = request.body;
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
            const addOnPrice = ((oi.addOns?.roti ?? 0) * 15 + (oi.addOns?.curry ?? 0) * 40);
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
fastify.get('/tables', async () => {
    return prisma.table.findMany({ include: { order: true } });
});
fastify.put('/tables/:id/status', async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;
    const updated = await prisma.table.update({
        where: { id: Number(id) },
        data: { status },
    });
    reply.send(updated);
});
// ---- Export for Vercel ------------------------------------------
export default async (req, res) => {
    await fastify.ready();
    return fastify.routing(req, res);
};
//# sourceMappingURL=server.js.map
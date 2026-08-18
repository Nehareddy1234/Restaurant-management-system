import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const menuImageByCategory: Record<string, string> = {
  Appetizers: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  'Main Course': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
  Biryani: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=600&q=80',
  Bread: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=600&q=80',
  Rice: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80',
  Desserts: 'https://images.unsplash.com/photo-1666190092159-3171cf470b53?auto=format&fit=crop&w=600&q=80',
  Beverages: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=600&q=80',
  Specials: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
};

const storeImageByCategory: Record<string, string> = {
  Spices: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  Grains: 'https://images.unsplash.com/photo-1586208958839-06c17cacdf08?auto=format&fit=crop&w=600&q=80',
  Oils: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
  Flours: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
};

async function main() {
  console.log('🌱 Starting seed data insertion...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.storeOrderItem.deleteMany();
  await prisma.supplierOrderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.storeOrder.deleteMany();
  await prisma.supplierOrder.deleteMany();
  await prisma.orderDailySequence.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.table.deleteMany();
  await prisma.groceryItem.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.storeProduct.deleteMany();
  await prisma.profile.deleteMany();

  // Seed Profiles
  console.log('👥 Seeding profiles...');
  await prisma.profile.createMany({
    data: [
      {
        id: 'admin-id-001',
        username: 'admin',
        displayName: 'Admin User',
        role: 'admin',
        password: '$2b$10$hashedpassword123',
        phone: '+91-9000000001',
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: 'system',
      },
      {
        id: 'manager-id-001',
        username: 'manager',
        displayName: 'Rajesh Manager',
        role: 'account_manager',
        password: '$2b$10$hashedpassword456',
        phone: '+91-9000000002',
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: 'admin-id-001',
      },
      {
        id: 'waiter-id-001',
        username: 'waiter1',
        displayName: 'Arjun Kumar (Waiter)',
        role: 'waiter',
        password: '$2b$10$hashedpassword789',
        phone: '+91-9100000001',
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: 'manager-id-001',
      },
      {
        id: 'waiter-id-002',
        username: 'waiter2',
        displayName: 'Priya Singh (Waiter)',
        role: 'waiter',
        password: '$2b$10$hashedpassword101',
        phone: '+91-9100000002',
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: 'manager-id-001',
      },
      {
        id: 'customer-id-001',
        username: 'rahul.singh',
        displayName: 'Rahul Singh',
        role: 'customer',
        phone: '+91-9200000001',
        address: '123 MG Road, Bangalore 560001',
        approvalStatus: 'approved',
        approvedAt: new Date(),
      },
      {
        id: 'customer-id-002',
        username: 'anjali.sharma',
        displayName: 'Anjali Sharma',
        role: 'customer',
        phone: '+91-9200000002',
        address: '456 Indiranagar, Bangalore 560038',
        approvalStatus: 'approved',
        approvedAt: new Date(),
      },
      {
        id: 'customer-id-003',
        username: 'vikram.patel',
        displayName: 'Vikram Patel',
        role: 'customer',
        phone: '+91-9200000003',
        address: '789 Koramangala, Bangalore 560034',
        approvalStatus: 'approved',
        approvedAt: new Date(),
      },
    ],
  });

  // Seed Tables
  console.log('🪑 Seeding tables...');
  await prisma.table.createMany({
    data: [
      { name: 'Table 1', capacity: 4, status: 'available' },
      { name: 'Table 2', capacity: 2, status: 'available' },
      { name: 'Table 3', capacity: 6, status: 'occupied' },
      { name: 'Table 4', capacity: 4, status: 'available' },
      { name: 'Table 5', capacity: 4, status: 'available' },
      { name: 'Table 6', capacity: 6, status: 'available' },
      { name: 'Table 7', capacity: 2, status: 'available' },
      { name: 'Table 8', capacity: 8, status: 'available' },
    ],
  });

  // Seed Menu Categories
  console.log('🏷️  Seeding menu categories...');
  await prisma.menuCategory.createMany({
    data: [
      { name: 'Appetizers' },
      { name: 'Main Course' },
      { name: 'Biryani' },
      { name: 'Bread' },
      { name: 'Rice' },
      { name: 'Desserts' },
      { name: 'Beverages' },
      { name: 'Specials' },
    ],
  });

  // Seed Menu Items
  console.log('🍽️  Seeding menu items...');
  await prisma.menuItem.createMany({
    data: [
      // Appetizers
      { name: 'Samosa (4 pcs)', category: 'Appetizers', price: 80, orderIndex: 1 },
      { name: 'Pakora Mix', category: 'Appetizers', price: 110, orderIndex: 2 },
      { name: 'Uggani Bajji', category: 'Appetizers', price: 90, orderIndex: 3 },
      // Main Course
      { name: 'Chicken Curry', category: 'Main Course', price: 260, orderIndex: 1 },
      { name: 'Mutton Curry', category: 'Main Course', price: 340, orderIndex: 2 },
      { name: 'Paneer Butter Masala', category: 'Main Course', price: 240, orderIndex: 3 },
      { name: 'Chana Masala', category: 'Main Course', price: 180, orderIndex: 4 },
      // Biryani
      { name: 'Rayalaseema Chicken Biryani', category: 'Biryani', price: 280, orderIndex: 1 },
      { name: 'Rayalaseema Mutton Biryani', category: 'Biryani', price: 360, orderIndex: 2 },
      { name: 'Vegetable Biryani', category: 'Biryani', price: 220, orderIndex: 3 },
      // Bread
      { name: 'Naan (2 pcs)', category: 'Bread', price: 60, orderIndex: 1 },
      { name: 'Jowar Roti (3 pcs)', category: 'Bread', price: 70, orderIndex: 2 },
      { name: 'Paratha (2 pcs)', category: 'Bread', price: 80, orderIndex: 3 },
      // Rice
      { name: 'Plain Rice', category: 'Rice', price: 100, orderIndex: 1 },
      { name: 'Jeera Rice', category: 'Rice', price: 130, orderIndex: 2 },
      // Desserts
      { name: 'Gulab Jamun (4 pcs)', category: 'Desserts', price: 90, orderIndex: 1 },
      { name: 'Kheer', category: 'Desserts', price: 100, orderIndex: 2 },
      { name: 'Jalebi', category: 'Desserts', price: 90, orderIndex: 3 },
      // Beverages
      { name: 'Masala Chai', category: 'Beverages', price: 30, orderIndex: 1 },
      { name: 'Lassi', category: 'Beverages', price: 70, orderIndex: 2 },
      { name: 'Mango Juice', category: 'Beverages', price: 80, orderIndex: 3 },
      // Specials
      { name: 'Curry Rice Combo', category: 'Specials', price: 260, orderIndex: 1 },
      { name: 'Family Feast', category: 'Specials', price: 1499, orderIndex: 2 },
      { name: 'Prawn Biryani', category: 'Biryani', price: 390, orderIndex: 4 },
      { name: 'Buttermilk', category: 'Beverages', price: 45, orderIndex: 4 },
    ].map(item => ({ ...item, image: menuImageByCategory[item.category] })),
  });

  // Seed Daily Order Sequence
  console.log('📅 Seeding order daily sequence...');
  const today = new Date().toISOString().split('T')[0];
  await prisma.orderDailySequence.create({
    data: {
      date: today,
      lastNumber: 5,
    },
  });

  // Seed Orders
  console.log('🧾 Seeding orders...');
  await prisma.order.createMany({
    data: [
      {
        id: 'order-demo-001',
        tableId: 1,
        total: 530,
        status: 'completed',
        customerId: 'customer-id-001',
        orderNumber: 1,
        paymentMethod: 'Cash',
        orderDate: today,
        customerName: 'Rahul Singh',
        paymentStatus: 'Paid',
        createdAt: new Date(Date.now() - 3600000),
        paidAt: new Date(Date.now() - 1800000),
      },
      {
        id: 'order-demo-002',
        tableId: 3,
        total: 600,
        status: 'completed',
        customerId: 'customer-id-002',
        orderNumber: 2,
        paymentMethod: 'Card',
        orderDate: today,
        customerName: 'Anjali Sharma',
        paymentStatus: 'Paid',
        createdAt: new Date(Date.now() - 2400000),
        paidAt: new Date(Date.now() - 1200000),
      },
      {
        id: 'order-demo-003',
        tableId: 5,
        total: 890,
        status: 'in-progress',
        orderNumber: 3,
        paymentMethod: 'Cash',
        orderDate: today,
        customerName: 'Table 5 Guest',
        paymentStatus: 'Pending',
        createdAt: new Date(Date.now() - 600000),
      },
      {
        id: 'order-demo-004',
        total: 340,
        status: 'completed',
        customerId: 'customer-id-003',
        orderNumber: 4,
        paymentMethod: 'UPI',
        orderDate: today,
        customerName: 'Vikram Patel',
        paymentStatus: 'Paid',
        createdAt: new Date(Date.now() - 7200000),
        paidAt: new Date(Date.now() - 5400000),
      },
      {
        id: 'order-demo-005',
        tableId: 2,
        total: 350,
        status: 'ready',
        orderNumber: 5,
        paymentMethod: 'Cash',
        orderDate: today,
        customerName: 'Guest',
        paymentStatus: 'Pending',
        createdAt: new Date(Date.now() - 1200000),
      },
    ],
  });

  // Seed Order Items
  console.log('🛒 Seeding order items...');
  await prisma.orderItem.createMany({
    data: [
      { orderId: 'order-demo-001', menuItemId: 8, quantity: 1 },
      { orderId: 'order-demo-001', menuItemId: 2, quantity: 1 },
      { orderId: 'order-demo-001', menuItemId: 20, quantity: 2 },
      { orderId: 'order-demo-002', menuItemId: 9, quantity: 1 },
      { orderId: 'order-demo-002', menuItemId: 12, quantity: 1 },
      { orderId: 'order-demo-002', menuItemId: 16, quantity: 1 },
      { orderId: 'order-demo-002', menuItemId: 21, quantity: 1 },
      { orderId: 'order-demo-003', menuItemId: 5, quantity: 2 },
      { orderId: 'order-demo-003', menuItemId: 13, quantity: 1 },
      { orderId: 'order-demo-003', menuItemId: 15, quantity: 1 },
      { orderId: 'order-demo-004', menuItemId: 8, quantity: 1 },
      { orderId: 'order-demo-004', menuItemId: 11, quantity: 1 },
      { orderId: 'order-demo-005', menuItemId: 10, quantity: 1 },
      { orderId: 'order-demo-005', menuItemId: 14, quantity: 1 },
      { orderId: 'order-demo-005', menuItemId: 19, quantity: 1 },
    ],
  });

  // Seed Grocery Items
  console.log('🥬 Seeding grocery items...');
  await prisma.groceryItem.createMany({
    data: [
      { name: 'Rice (20kg)', quantity: 50, unit: 'kg', purchased: true },
      { name: 'Flour (20kg)', quantity: 30, unit: 'kg', purchased: true },
      { name: 'Chicken', quantity: 100, unit: 'kg', purchased: true },
      { name: 'Mutton', quantity: 50, unit: 'kg', purchased: false },
      { name: 'Paneer', quantity: 20, unit: 'kg', purchased: true },
      { name: 'Onions', quantity: 100, unit: 'kg', purchased: true },
      { name: 'Tomatoes', quantity: 80, unit: 'kg', purchased: true },
      { name: 'Garlic', quantity: 10, unit: 'kg', purchased: true },
      { name: 'Ginger', quantity: 5, unit: 'kg', purchased: true },
      { name: 'Spices Mix', quantity: 50, unit: 'packets', purchased: true },
      { name: 'Oil (Litre)', quantity: 100, unit: 'litres', purchased: true },
    ],
  });

  // Seed Expenses
  console.log('💰 Seeding expenses...');
  await prisma.expense.createMany({
    data: [
      {
        description: 'Gas Cylinder',
        category: 'Utilities',
        amount: 1200,
        date: new Date(Date.now() - 86400000),
      },
      {
        description: 'Staff Salary - August',
        category: 'Salaries',
        amount: 150000,
        date: new Date(Date.now() - 172800000),
      },
      {
        description: 'Rent Payment',
        category: 'Rent',
        amount: 55000,
        date: new Date(Date.now() - 259200000),
      },
      {
        description: 'Cleaning Supplies',
        category: 'Maintenance',
        amount: 2800,
        date: new Date(),
      },
      {
        description: 'Electricity Bill',
        category: 'Utilities',
        amount: 18000,
        date: new Date(Date.now() - 432000000),
      },
    ],
  });

  // Seed Store Products
  console.log('🏪 Seeding store products...');
  await prisma.storeProduct.createMany({
    data: [
      {
        id: 'prod-001',
        name: 'Organic Curry Powder (500g)',
        category: 'Spices',
        price: 180,
        buyingCost: 125,
        stock: 50,
        lowStockThreshold: 20,
      },
      {
        id: 'prod-002',
        name: 'Basmati Rice (5kg)',
        category: 'Grains',
        price: 720,
        buyingCost: 600,
        stock: 100,
        lowStockThreshold: 30,
      },
      {
        id: 'prod-003',
        name: 'Edible Oil (2L)',
        category: 'Oils',
        price: 360,
        buyingCost: 290,
        stock: 45,
        lowStockThreshold: 15,
      },
      {
        id: 'prod-004',
        name: 'Chickpea Flour (1kg)',
        category: 'Flours',
        price: 95,
        buyingCost: 75,
        stock: 80,
        lowStockThreshold: 25,
      },
      {
        id: 'prod-005',
        name: 'Whole Wheat Flour (5kg)',
        category: 'Flours',
        price: 310,
        buyingCost: 260,
        stock: 60,
        lowStockThreshold: 20,
      },
      {
        id: 'prod-006',
        name: 'Fennel Seeds (500g)',
        category: 'Spices',
        price: 150,
        buyingCost: 115,
        stock: 35,
        lowStockThreshold: 15,
      },
      {
        id: 'prod-007',
        name: 'Turmeric Powder (500g)',
        category: 'Spices',
        price: 100,
        buyingCost: 75,
        stock: 90,
        lowStockThreshold: 30,
      },
      {
        id: 'prod-008',
        name: 'Black Pepper (500g)',
        category: 'Spices',
        price: 420,
        buyingCost: 350,
        stock: 25,
        lowStockThreshold: 10,
      },
    ].map(item => ({ ...item, image: storeImageByCategory[item.category] })),
  });

  // Seed Supplier Orders
  console.log('📦 Seeding supplier orders...');
  await prisma.supplierOrder.createMany({
    data: [
      {
        id: 'supplier-order-001',
        supplierName: 'Spice King Traders',
        status: 'Received',
        totalAmount: 6050,
        paymentStatus: 'Paid',
        orderDate: new Date(Date.now() - 604800000),
        receiveDate: new Date(Date.now() - 518400000),
        paymentDate: new Date(Date.now() - 432000000),
      },
      {
        id: 'supplier-order-002',
        supplierName: 'Rice Mills Limited',
        status: 'Ordered',
        totalAmount: 15000,
        paymentStatus: 'Unpaid',
        orderDate: new Date(Date.now() - 86400000),
      },
      {
        id: 'supplier-order-003',
        supplierName: 'Fresh Grains Co',
        status: 'Received',
        totalAmount: 6900,
        paymentStatus: 'Paid',
        orderDate: new Date(Date.now() - 1209600000),
        receiveDate: new Date(Date.now() - 1123200000),
        paymentDate: new Date(Date.now() - 1123200000),
      },
    ],
  });

  // Seed Supplier Order Items
  console.log('📋 Seeding supplier order items...');
  await prisma.supplierOrderItem.createMany({
    data: [
      { supplierOrderId: 'supplier-order-001', productId: 'prod-001', quantity: 30, buyingCost: 125 },
      { supplierOrderId: 'supplier-order-001', productId: 'prod-006', quantity: 20, buyingCost: 115 },
      { supplierOrderId: 'supplier-order-002', productId: 'prod-002', quantity: 25, buyingCost: 600 },
      { supplierOrderId: 'supplier-order-003', productId: 'prod-004', quantity: 40, buyingCost: 75 },
      { supplierOrderId: 'supplier-order-003', productId: 'prod-005', quantity: 15, buyingCost: 260 },
    ],
  });

  // Seed Store Orders
  console.log('🛍️  Seeding store orders...');
  await prisma.storeOrder.createMany({
    data: [
      {
        id: 'store-order-001',
        orderNumber: 'SO-001',
        totalAmount: 1980,
        paymentMethod: 'Cash',
        orderDate: new Date(Date.now() - 86400000),
      },
      {
        id: 'store-order-002',
        orderNumber: 'SO-002',
        totalAmount: 1535,
        paymentMethod: 'Card',
        orderDate: new Date(Date.now() - 172800000),
      },
    ],
  });

  // Seed Store Order Items
  console.log('📦 Seeding store order items...');
  await prisma.storeOrderItem.createMany({
    data: [
      { storeOrderId: 'store-order-001', productId: 'prod-001', quantity: 5, price: 180, buyingCost: 125 },
      { storeOrderId: 'store-order-001', productId: 'prod-003', quantity: 3, price: 360, buyingCost: 290 },
      { storeOrderId: 'store-order-002', productId: 'prod-002', quantity: 2, price: 720, buyingCost: 600 },
      { storeOrderId: 'store-order-002', productId: 'prod-004', quantity: 1, price: 95, buyingCost: 75 },
    ],
  });

  console.log('✅ Seed data inserted successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

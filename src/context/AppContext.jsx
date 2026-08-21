import { createContext, useContext, useState, useEffect, useRef } from 'react';
import fallbackFoodImage from '../assets/hero.png';

// Bundled fallback keeps menu cards visible even when a remotely hosted photo is unavailable.
export const FALLBACK_FOOD_IMAGE = fallbackFoodImage;

const AppContext = createContext(null);

// Use relative URLs on Vercel (website), full URL in Capacitor (APK)
const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;
const API_BASE = isCapacitor ? 'https://nehaskitchen.vercel.app' : '';

const initialTables = [
  { id: 1, name: 'T1', capacity: 4, status: 'available', order: null },
  { id: 2, name: 'T2', capacity: 2, status: 'available', order: null },
  { id: 3, name: 'T3', capacity: 6, status: 'available', order: null },
  { id: 4, name: 'T4', capacity: 4, status: 'available', order: null },
  { id: 5, name: 'T5', capacity: 4, status: 'available', order: null },
  { id: 6, name: 'T6', capacity: 6, status: 'available', order: null },
  { id: 7, name: 'T7', capacity: 2, status: 'available', order: null },
];

const storeImageByCategory = {
  Spices: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  Grains: 'https://images.unsplash.com/photo-1586208958839-06c17cacdf08?auto=format&fit=crop&w=600&q=80',
  Oils: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
  Flours: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
};

// Demo data for showcasing without backend
const initialMenuItems = [
  // Appetizers
  { id: 1, name: 'Samosa (4 pcs)', category: 'Appetizers', price: 80, enabled: true, availableOnline: true, orderIndex: 1, image: 'https://thumbs.dreamstime.com/b/indian-samosa-13580921.jpg?w=768' },
  { id: 2, name: 'Pakora Mix', category: 'Appetizers', price: 110, enabled: true, availableOnline: true, orderIndex: 2, image: 'https://thumbs.dreamstime.com/b/indian-favourite-street-fried-food-pakora-also-know-as-pakoda-bhajiya-kanda-bhaji-pyaz-pakoda-fried-chillies-fried-onion-indian-205191576.jpg?w=768' },
  { id: 3, name: 'Uggani Bajji', category: 'Appetizers', price: 90, enabled: true, availableOnline: true, orderIndex: 3, image: 'https://thumbs.dreamstime.com/b/closeup-south-indian-breakfast-puffed-rice-upma-its-has-many-names-called-uggani-vaggani-borugulu-buggani-borugula-upma-157590575.jpg?w=768' },
  // Main Course
  { id: 4, name: 'Chicken Curry', category: 'Main Course', price: 260, enabled: true, availableOnline: true, orderIndex: 1, image: 'https://thumbs.dreamstime.com/b/chicken-curry-29197236.jpg?w=768' },
  { id: 5, name: 'Mutton Curry', category: 'Main Course', price: 340, enabled: true, availableOnline: true, orderIndex: 2, image: 'https://thumbs.dreamstime.com/b/mutton-curry-indian-style-11521250.jpg?w=768' },
  { id: 6, name: 'Paneer Butter Masala', category: 'Main Course', price: 240, enabled: true, availableOnline: true, orderIndex: 3, image: 'https://thumbs.dreamstime.com/b/indian-meal-punjabi-paneer-butter-masala-roti-indian-main-course-lunch-dinner-paneer-butter-masala-curry-roti-indian-109156151.jpg?w=768' },
  { id: 7, name: 'Chana Masala', category: 'Main Course', price: 180, enabled: true, availableOnline: true, orderIndex: 4, image: 'https://thumbs.dreamstime.com/b/channa-masala-indian-dish-prepared-chickpeas-47871577.jpg?w=768' },
  // Biryani
  { id: 8, name: 'Rayalaseema Chicken Biryani', category: 'Biryani', price: 280, enabled: true, availableOnline: true, orderIndex: 1, image: 'https://thumbs.dreamstime.com/b/chicken-biryani-19027920.jpg?w=768' },
  { id: 9, name: 'Rayalaseema Mutton Biryani', category: 'Biryani', price: 360, enabled: true, availableOnline: true, orderIndex: 2, image: 'https://thumbs.dreamstime.com/b/mutton-biryani-19018243.jpg?w=768' },
  { id: 10, name: 'Vegetable Biryani', category: 'Biryani', price: 220, enabled: true, availableOnline: true, orderIndex: 3, image: 'https://thumbs.dreamstime.com/b/vegetable-biryani-17694437.jpg?w=768' },
  // Bread
  { id: 11, name: 'Naan (2 pcs)', category: 'Bread', price: 60, enabled: true, availableOnline: true, orderIndex: 1, image: 'https://thumbs.dreamstime.com/b/tanoori-naan-plate-17512636.jpg?w=768' },
  { id: 12, name: 'Jowar Roti (3 pcs)', category: 'Bread', price: 70, enabled: true, availableOnline: true, orderIndex: 2, image: 'https://thumbs.dreamstime.com/b/flat-bread-made-sorghum-flour-39938807.jpg?w=768' },
  { id: 13, name: 'Paratha (2 pcs)', category: 'Bread', price: 80, enabled: true, availableOnline: true, orderIndex: 3, image: 'https://thumbs.dreamstime.com/b/indian-paratha-multi-layered-flat-bread-36118722.jpg?w=768' },
  // Rice
  { id: 14, name: 'Plain Rice', category: 'Rice', price: 100, enabled: true, availableOnline: true, orderIndex: 1, image: 'https://thumbs.dreamstime.com/b/rice-bowl-isolated-white-background-55359436.jpg?w=768' },
  { id: 15, name: 'Jeera Rice', category: 'Rice', price: 130, enabled: true, availableOnline: true, orderIndex: 2, image: 'https://thumbs.dreamstime.com/b/jeera-rice-long-grain-basmati-flavoured-fried-cumin-seeds-beaten-copper-steel-serving-bowl-34444475.jpg?w=992' },
  // Desserts
  { id: 16, name: 'Gulab Jamun (4 pcs)', category: 'Desserts', price: 90, enabled: true, availableOnline: true, orderIndex: 1, image: 'https://thumbs.dreamstime.com/b/indian-dessert-gulab-jamun-28400036.jpg?w=768' },
  { id: 17, name: 'Kheer', category: 'Desserts', price: 100, enabled: true, availableOnline: true, orderIndex: 2, image: 'https://thumbs.dreamstime.com/b/indian-desert-kheer-22421541.jpg?w=768' },
  { id: 18, name: 'Jalebi', category: 'Desserts', price: 90, enabled: true, availableOnline: true, orderIndex: 3, image: 'https://thumbs.dreamstime.com/b/indian-jalebi-plate-5092277.jpg?w=768' },
  // Beverages
  { id: 19, name: 'Masala Chai', category: 'Beverages', price: 30, enabled: true, availableOnline: true, orderIndex: 1, image: 'https://thumbs.dreamstime.com/b/indian-masala-chai-tea-spiced-tea-milk-rustic-wooden-table-63636590.jpg?w=768' },
  { id: 20, name: 'Lassi', category: 'Beverages', price: 70, enabled: true, availableOnline: true, orderIndex: 2, image: 'https://thumbs.dreamstime.com/b/traditional-mild-salted-lassi-26587492.jpg?w=768' },
  { id: 21, name: 'Mango Juice', category: 'Beverages', price: 80, enabled: true, availableOnline: true, orderIndex: 3, image: 'https://thumbs.dreamstime.com/b/mango-juice-14422970.jpg?w=768' },
  // Specials
  { id: 22, name: 'Curry Rice Combo', category: 'Specials', price: 260, enabled: true, availableOnline: true, orderIndex: 1, image: 'https://thumbs.dreamstime.com/b/butter-dal-jeera-rice-combo-takeaway-makhani-creamy-rich-easy-to-make-flavorful-lentil-dish-made-using-whole-black-195902344.jpg?w=768' },
  { id: 23, name: 'Family Feast', category: 'Specials', price: 1499, enabled: true, availableOnline: true, orderIndex: 2, image: 'https://thumbs.dreamstime.com/b/thanksgiving-dinner-roasted-turkey-garnished-cranberries-rustic-style-table-decoraded-pumpkins-vegetables-pie-127581137.jpg?w=768' },
  { id: 24, name: 'Prawn Biryani', category: 'Biryani', price: 390, enabled: true, availableOnline: true, orderIndex: 4, image: 'https://thumbs.dreamstime.com/b/prawn-biryani-indian-jinga-36297289.jpg?w=768' },
  { id: 25, name: 'Buttermilk', category: 'Beverages', price: 45, enabled: true, availableOnline: true, orderIndex: 4, image: 'https://thumbs.dreamstime.com/b/fresh-buttermilk-28603169.jpg?w=768' },
];

const initialFoodCategories = [
  { id: 1, name: 'Appetizers' },
  { id: 2, name: 'Main Course' },
  { id: 3, name: 'Biryani' },
  { id: 4, name: 'Bread' },
  { id: 5, name: 'Rice' },
  { id: 6, name: 'Desserts' },
  { id: 7, name: 'Beverages' },
  { id: 8, name: 'Specials' },
];

const initialGroceryItems = [
  { id: 1, name: 'Rice (20kg)', quantity: 50, unit: 'kg', purchased: true, image: 'https://images.unsplash.com/photo-1586208958839-06c17cacdf08?auto=format&fit=crop&w=600&q=80' },
  { id: 2, name: 'Flour (20kg)', quantity: 30, unit: 'kg', purchased: true, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80' },
  { id: 3, name: 'Chicken', quantity: 100, unit: 'kg', purchased: true, image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80' },
  { id: 4, name: 'Mutton', quantity: 50, unit: 'kg', purchased: false, image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=600&q=80' },
  { id: 5, name: 'Paneer', quantity: 20, unit: 'kg', purchased: true, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80' },
  { id: 6, name: 'Onions', quantity: 100, unit: 'kg', purchased: true, image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80' },
  { id: 7, name: 'Tomatoes', quantity: 80, unit: 'kg', purchased: true, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80' },
  { id: 8, name: 'Garlic', quantity: 10, unit: 'kg', purchased: true, image: 'https://images.unsplash.com/photo-1620601974154-8c8808605332?auto=format&fit=crop&w=600&q=80' },
  { id: 9, name: 'Ginger', quantity: 5, unit: 'kg', purchased: true, image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80' },
  { id: 10, name: 'Spices Mix', quantity: 50, unit: 'packets', purchased: true, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80' },
];

const initialStoreInventory = [
  { id: 'prod-001', name: 'Organic Curry Powder (500g)', category: 'Spices', price: 180, stock: 50, lowStockThreshold: 20, buyingCost: 125 },
  { id: 'prod-002', name: 'Basmati Rice (5kg)', category: 'Grains', price: 720, stock: 100, lowStockThreshold: 30, buyingCost: 600 },
  { id: 'prod-003', name: 'Edible Oil (2L)', category: 'Oils', price: 360, stock: 45, lowStockThreshold: 15, buyingCost: 290 },
  { id: 'prod-004', name: 'Chickpea Flour (1kg)', category: 'Flours', price: 95, stock: 80, lowStockThreshold: 25, buyingCost: 75 },
  { id: 'prod-005', name: 'Whole Wheat Flour (5kg)', category: 'Flours', price: 310, stock: 60, lowStockThreshold: 20, buyingCost: 260 },
].map(item => ({ ...item, image: storeImageByCategory[item.category] }));

const createDemoOrders = () => {
  const now = Date.now();
  return [
    { id: 'demo-active-101', orderNumber: 101, tableId: 3, table: 'Table T3', customerName: 'Aarav', itemList: ['Rayalaseema Chicken Biryani x1', 'Lassi x2'], total: 420, status: 'Preparing', paymentMethod: 'UPI', paymentStatus: 'Pending', createdAt: new Date(now - 18 * 60000).toISOString(), time: '12:42 PM' },
    { id: 'demo-active-102', orderNumber: 102, tableId: 5, table: 'Table T5', customerName: 'Meera', itemList: ['Paneer Butter Masala x1', 'Naan (2 pcs) x1', 'Jeera Rice x1'], total: 430, status: 'Ready', paymentMethod: 'Cash', paymentStatus: 'Pending', createdAt: new Date(now - 10 * 60000).toISOString(), time: '12:50 PM' },
    { id: 'demo-paid-098', orderNumber: 98, tableId: 1, table: 'Table T1', customerName: 'Kiran', itemList: ['Vegetable Biryani x1', 'Buttermilk x1'], total: 265, status: 'Paid', paymentMethod: 'Card', paymentStatus: 'Paid', createdAt: new Date(now - 80 * 60000).toISOString(), paidAt: new Date(now - 60 * 60000).toISOString(), closedAt: '12:00 PM' },
    { id: 'demo-paid-099', orderNumber: 99, table: 'Takeaway', customerName: 'Sana', itemList: ['Chicken Curry x1', 'Paratha (2 pcs) x2'], total: 420, status: 'Paid', paymentMethod: 'UPI', paymentStatus: 'Paid', createdAt: new Date(now - 55 * 60000).toISOString(), paidAt: new Date(now - 45 * 60000).toISOString(), closedAt: '12:15 PM' },
    { id: 'demo-pay-later-100', orderNumber: 100, table: 'Takeaway', customerName: 'Vikram', itemList: ['Mutton Curry x1', 'Jowar Roti (3 pcs) x1'], total: 410, status: 'Paid', paymentMethod: 'Pay Later', paymentStatus: 'Pending', createdAt: new Date(now - 35 * 60000).toISOString(), closedAt: '12:35 PM' },
    { id: 'demo-history-094', orderNumber: 94, table: 'Table T2', customerName: 'Nisha', itemList: ['Samosa (4 pcs) x1', 'Masala Chai x2'], total: 140, status: 'Paid', paymentMethod: 'Cash', paymentStatus: 'Paid', createdAt: new Date(now - 1 * 86400000).toISOString(), paidAt: new Date(now - 1 * 86400000 + 12 * 60000).toISOString(), closedAt: '8:42 PM' },
    { id: 'demo-history-093', orderNumber: 93, table: 'Table T6', customerName: 'Rohit', itemList: ['Rayalaseema Mutton Biryani x2', 'Buttermilk x2'], total: 810, status: 'Paid', paymentMethod: 'Card', paymentStatus: 'Paid', createdAt: new Date(now - 1 * 86400000 - 40 * 60000).toISOString(), paidAt: new Date(now - 1 * 86400000 - 24 * 60000).toISOString(), closedAt: '8:06 PM' },
    { id: 'demo-history-092', orderNumber: 92, table: 'Takeaway', customerName: 'Divya', itemList: ['Curry Rice Combo x2', 'Mango Juice x2'], total: 680, status: 'Paid', paymentMethod: 'UPI', paymentStatus: 'Paid', createdAt: new Date(now - 2 * 86400000).toISOString(), paidAt: new Date(now - 2 * 86400000 + 9 * 60000).toISOString(), closedAt: '7:35 PM' },
    { id: 'demo-history-091', orderNumber: 91, table: 'Table T4', customerName: 'Ananya', itemList: ['Paneer Butter Masala x1', 'Naan (2 pcs) x2', 'Gulab Jamun (4 pcs) x1'], total: 450, status: 'Paid', paymentMethod: 'Cash', paymentStatus: 'Paid', createdAt: new Date(now - 3 * 86400000).toISOString(), paidAt: new Date(now - 3 * 86400000 + 17 * 60000).toISOString(), closedAt: '9:17 PM' },
    { id: 'demo-history-090', orderNumber: 90, table: 'Table T1', customerName: 'Kabir', itemList: ['Prawn Biryani x1', 'Lassi x1'], total: 460, status: 'Paid', paymentMethod: 'Card', paymentStatus: 'Paid', createdAt: new Date(now - 4 * 86400000).toISOString(), paidAt: new Date(now - 4 * 86400000 + 15 * 60000).toISOString(), closedAt: '8:15 PM' },
    { id: 'demo-history-089', orderNumber: 89, table: 'Takeaway', customerName: 'Ishita', itemList: ['Vegetable Biryani x1', 'Jalebi x1'], total: 310, status: 'Paid', paymentMethod: 'UPI', paymentStatus: 'Paid', createdAt: new Date(now - 5 * 86400000).toISOString(), paidAt: new Date(now - 5 * 86400000 + 11 * 60000).toISOString(), closedAt: '7:11 PM' },
  ];
};

const initialStoreOrders = [
  { id: 'demo-store-001', orderNumber: 'SO-1042', totalAmount: 1080, paymentMethod: 'UPI', orderDate: new Date().toISOString(), items: [{ id: 'prod-003', name: 'Edible Oil (2L)', price: 360, buyingCost: 290, quantity: 2 }, { id: 'prod-001', name: 'Organic Curry Powder (500g)', price: 180, buyingCost: 125, quantity: 2 }] },
  { id: 'demo-store-002', orderNumber: 'SO-1041', totalAmount: 1535, paymentMethod: 'Card', orderDate: new Date(Date.now() - 86400000).toISOString(), items: [{ id: 'prod-002', name: 'Basmati Rice (5kg)', price: 720, buyingCost: 600, quantity: 2 }, { id: 'prod-004', name: 'Chickpea Flour (1kg)', price: 95, buyingCost: 75, quantity: 1 }] },
];

const initialSupplierOrders = [
  { id: 'demo-supplier-001', supplierName: 'Sri Lakshmi Traders', status: 'Received', paymentStatus: 'Paid', totalAmount: 6050, orderDate: new Date(Date.now() - 3 * 86400000).toISOString(), items: [{ productId: 'prod-001', quantity: 30, buyingCost: 125, product: { name: 'Organic Curry Powder (500g)' } }, { productId: 'prod-004', quantity: 30, buyingCost: 75, product: { name: 'Chickpea Flour (1kg)' } }] },
  { id: 'demo-supplier-002', supplierName: 'Bangalore Rice Mills', status: 'Ordered', paymentStatus: 'Unpaid', totalAmount: 15000, orderDate: new Date(Date.now() - 86400000).toISOString(), items: [{ productId: 'prod-002', quantity: 25, buyingCost: 600, product: { name: 'Basmati Rice (5kg)' } }] },
];

const IST_TIME_OPTIONS = {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

const IST_DATE_OPTIONS = {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

function formatIstTime(value = new Date()) {
  return new Date(value).toLocaleTimeString('en-IN', IST_TIME_OPTIONS).toUpperCase();
}

function formatIstDate(value = new Date()) {
  return new Date(value).toLocaleDateString('en-IN', IST_DATE_OPTIONS);
}

function getIstDateInputValue(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);

  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

const mergeLocalActiveOrders = (previousOrders, backendOrders) => {
  const localOrders = previousOrders.filter(order => String(order.id).startsWith('local-'));
  const backendIds = new Set(backendOrders.map(order => order.id));
  return [
    ...localOrders.filter(order => !backendIds.has(order.id)),
    ...backendOrders,
  ];
};

const isClosedOrder = (order) => {
  const status = String(order?.status || '').toLowerCase();
  return status === 'paid' || status === 'closed' || status === 'completed';
};

const DEMO_ORDERS_STORAGE_KEY = 'nehas-kitchen-demo-orders';

const readDemoOrders = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(DEMO_ORDERS_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

export function AppProvider({ children }) {
  const [appMode, setAppMode] = useState('restaurant'); // 'restaurant' | 'grocery'

  const [tables, setTables] = useState(initialTables);

  const [activeOrders, setActiveOrders] = useState(() => {
    const savedOrders = readDemoOrders();
    const sampleOrders = createDemoOrders();
    const orders = [...savedOrders, ...sampleOrders.filter(sample => !savedOrders.some(saved => saved.id === sample.id))];
    return orders.filter(order => !isClosedOrder(order));
  });
  const [orderHistory, setOrderHistory] = useState(() => {
    const savedOrders = readDemoOrders();
    const sampleOrders = createDemoOrders();
    const orders = [...savedOrders, ...sampleOrders.filter(sample => !savedOrders.some(saved => saved.id === sample.id))];
    return orders.filter(isClosedOrder);
  });
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [foodCategories, setFoodCategories] = useState(initialFoodCategories);
  const [groceryItems, setGroceryItems] = useState(initialGroceryItems);
  const [storeInventory, setStoreInventory] = useState(initialStoreInventory);
  const [storeOrders, setStoreOrders] = useState(initialStoreOrders);
  const [supplierOrders, setSupplierOrders] = useState(initialSupplierOrders);
  const [dataErrors, setDataErrors] = useState({});
  // Configurable refresh interval (ms) – default 30 seconds
  const REFRESH_INTERVAL_MS = 120000;
  const [autoRefreshEnabled] = useState(true);
  const isRefreshingRef = useRef(false);
  const pendingClosedOrderIdsRef = useRef(new Set());

  // The production API is optional during demos. Persist completed actions locally
  // so placing orders and taking payment still works when no API is running.
  useEffect(() => {
    try {
      localStorage.setItem(DEMO_ORDERS_STORAGE_KEY, JSON.stringify([...activeOrders, ...orderHistory]));
    } catch (error) {
      console.warn('Unable to persist demo orders locally.', error);
    }
  }, [activeOrders, orderHistory]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setTables(previous => previous.map(table => {
      const activeOrder = activeOrders.find(order => order.tableId === table.id);
      return activeOrder ? { ...table, status: 'occupied', order: activeOrder } : table.order ? { ...table, status: 'available', order: null } : table;
    }));
  }, [activeOrders]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const loadBackendData = async () => {
    // Demo mode: Disable backend fetching
    return;
  };

  // Lazy-load orders separately to avoid heavy initial payload
  const loadOrders = async () => {
    // Demo mode: Disable backend fetching
    return;
  };

  // Fetch initial data from backend (fallback to defaults if backend not ready)
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        await loadBackendData();
        // Pre-load orders if auto-refresh is enabled and user wants them
        if (autoRefreshEnabled) {
          await loadOrders();
        }
      } catch (err) {
        console.error("Backend not reachable. Falling back to local state.", err);
      }
    };
    fetchBackendData();
  }, []);
  // Auto-refresh interval - respects autoRefreshEnabled flag

  // Refresh all data from the backend
  const refreshData = async () => { };

  useEffect(() => {
    if (!autoRefreshEnabled) return undefined;
    const intervalId = setInterval(() => {
      refreshData();
    }, REFRESH_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefreshEnabled]);

  // Responsive Layout States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(() => {
    return localStorage.getItem('sidebarMinimized') === 'true';
  });

  const toggleSidebarMinimized = () => {
    setSidebarMinimized(prev => {
      const next = !prev;
      localStorage.setItem('sidebarMinimized', String(next));
      return next;
    });
  };

  const toggleSidebarOpen = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  // Removed secondary refresh interval (15 s). The primary auto-refresh above now runs every REFRESH_INTERVAL_MS (2 min).

  const buildLocalOrder = (cartItems, tableId, paymentMethod = 'Cash', customerName = '', id = `local-${Date.now()}`) => {
    const now = new Date();
    const addOnTotal = (item) => ((item.addOns?.Roti || 0) * 15) + ((item.addOns?.Curry || 0) * 40);
    const total = cartItems.reduce((sum, item) => sum + (item.price + addOnTotal(item)) * item.quantity, 0);
    return {
      id,
      orderNumber: Date.now().toString().slice(-6),
      table: tableId ? `Table ${tables.find(t => t.id === tableId)?.name || tableId}` : 'Takeaway',
      items: cartItems.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        addOns: item.addOns || {},
        price: item.price,
        menuItem: item
      })),
      itemList: cartItems.map(item => {
        let name = item.name;
        const addOns = item.addOns || {};
        const addOnParts = [];
        if (addOns.Roti && addOns.Roti !== 0) addOnParts.push(`${addOns.Roti > 0 ? '+' : ''}${addOns.Roti} Roti`);
        if (addOns.Curry && addOns.Curry !== 0) addOnParts.push(`${addOns.Curry > 0 ? '+' : ''}${addOns.Curry} Curry`);
        if (addOnParts.length) name += ` (${addOnParts.join(', ')})`;
        return `${name} x${item.quantity}`;
      }),
      total,
      status: 'Preparing',
      paymentMethod,
      customerName: customerName.trim() || null,
      time: formatIstTime(now),
      createdAt: now.toISOString(),
    };
  };

  const upsertActiveOrder = (order) => {
    setActiveOrders(prev => {
      const exists = prev.some(o => o.id === order.id);
      return exists ? prev.map(o => o.id === order.id ? order : o) : [order, ...prev];
    });
  };

  const setTableOrder = (tableId, order) => {
    if (tableId) {
      setTables(prev => prev.map(t =>
        t.id === tableId ? { ...t, status: 'occupied', order } : t
      ));
    }
  };

  // Place a new order
  const placeOrder = async (cartItems, tableId, paymentMethod = 'Cash', customerName = '', parcelCharge = 0) => {
    const tempId = `local-${Date.now()}`;
    const optimisticOrder = buildLocalOrder(cartItems, tableId, paymentMethod, customerName, tempId);
    upsertActiveOrder(optimisticOrder);
    setTableOrder(tableId, optimisticOrder);

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send price per item so backend can accurately compute the total (incl. add-ons)
        body: JSON.stringify({
          tableId: tableId || null,
          paymentMethod,
          customerName,
          parcelCharge: parcelCharge || 0,
          items: cartItems.map(c => ({
            menuItemId: c.id,
            quantity: c.quantity,
            addOns: c.addOns || null,
            price: c.price,
          }))
        })
      });
      if (res.ok) {
        const newOrder = await res.json(); // already mapped: has itemList, table string, time
        setActiveOrders(prev => prev.map(o => o.id === tempId ? newOrder : o));
        setTableOrder(tableId, newOrder);
        return newOrder.id;
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('placeOrder API error:', err);
        console.warn('Order API unavailable; order is saved in demo mode.', err);
        return tempId;
      }
    } catch (e) {
      console.warn('Order API unavailable; order is saved in demo mode.', e);
      return tempId;
    }
  };

  const updateOrder = async (orderId, cartItems, tableId, customerName = undefined, parcelCharge = 0) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: tableId || null,
          customerName,
          parcelCharge: parcelCharge || 0,
          items: cartItems.map(c => ({
            menuItemId: c.id,
            quantity: c.quantity,
            addOns: c.addOns || null,
            price: c.price,
          }))
        })
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setActiveOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        // Sync table assignment
        setTables(prev => prev.map(t => {
          if (t.order?.id === orderId) {
            return tableId && t.id === tableId
              ? { ...t, status: 'occupied', order: updatedOrder }
              : { ...t, status: 'available', order: null };
          }
          if (tableId && t.id === tableId) return { ...t, status: 'occupied', order: updatedOrder };
          return t;
        }));
        return updatedOrder.id;
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('updateOrder API error:', err);
      }
    } catch (e) {
      console.error('Failed to update order via API', e);
    }
    const existingOrder = activeOrders.find(order => order.id === orderId);
    if (!existingOrder) return null;
    const locallyUpdatedOrder = {
      ...existingOrder,
      ...buildLocalOrder(cartItems, tableId, existingOrder.paymentMethod, customerName ?? existingOrder.customerName, orderId),
      status: existingOrder.status,
      paymentStatus: existingOrder.paymentStatus,
    };
    setActiveOrders(prev => prev.map(order => order.id === orderId ? locallyUpdatedOrder : order));
    setTables(prev => prev.map(table => {
      if (table.order?.id === orderId) return table.id === tableId ? { ...table, order: locallyUpdatedOrder } : { ...table, status: 'available', order: null };
      return table.id === tableId ? { ...table, status: 'occupied', order: locallyUpdatedOrder } : table;
    }));
    console.warn('Order API unavailable; order changes were saved in demo mode.');
    return orderId;
  };

  const correctHistoricalOrder = async (orderId, corrections) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correction: true, ...corrections }),
      });
      if (!res.ok) throw new Error(`Failed to update order (${res.status})`);
      const updatedOrder = await res.json();
      setOrderHistory(prev => prev.map(order => order.id === orderId ? updatedOrder : order));
      return updatedOrder;
    } catch (error) {
      const existingOrder = orderHistory.find(order => order.id === orderId);
      if (!existingOrder) throw error;
      const updatedOrder = { ...existingOrder, ...corrections };
      setOrderHistory(prev => prev.map(order => order.id === orderId ? updatedOrder : order));
      console.warn('Order API unavailable; correction was saved in demo mode.', error);
      return updatedOrder;
    }
  };

  const updateOrderItemQuantity = (orderId, nameToUpdate, delta) => {
    // Inline quantity adjustment — reflects in UI only (use Edit Order for full changes)
    setActiveOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItemList = (o.itemList || []).map(itemStr => {
        const match = itemStr.match(/^(.+) x(\d+)$/);
        if (!match) return itemStr;
        const name = match[1];
        const qty = parseInt(match[2], 10);
        const cleanName = name.replace(/\s*\([^)]+\)/g, '').trim();
        if (cleanName !== nameToUpdate) return itemStr;
        const newQty = qty + delta;
        if (newQty <= 0) return null;
        return `${name} x${newQty}`;
      }).filter(Boolean);
      return { ...o, itemList: newItemList };
    }));
  };

  const markOrderReady = async (orderId) => {
    setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Ready' } : o));
    try {
      await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Ready' })
      });
    } catch { /* ignore */ }
  };

  const closeOrder = async (orderId, paymentMethod = null) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (order) {
      pendingClosedOrderIdsRef.current.add(orderId);
      const finalPaymentMethod = paymentMethod || order.paymentMethod || 'Cash';
      const isPayLater = finalPaymentMethod === 'Pay Later';
      const paidOrder = {
        ...order,
        status: 'Paid',
        closedAt: formatIstTime(),
        paymentMethod: finalPaymentMethod,
        paymentStatus: isPayLater ? 'Pending' : 'Paid',
        paidAt: isPayLater ? null : new Date().toISOString(),
      };
      setOrderHistory(prev => [paidOrder, ...prev]);
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      setTables(prev => prev.map(t => t.order?.id === orderId ? { ...t, status: 'available', order: null } : t));

      try {
        const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Paid', paymentMethod: finalPaymentMethod })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.details || err.error || `Failed to close order (${res.status})`);
        }
        await refreshData();
      } catch (e) {
        console.warn('Payment API unavailable; payment was recorded in demo mode.', e);
        return;
      }
    }
  };

  const deleteOrder = async (orderId) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (order) {
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      setTables(prev => prev.map(t => t.order?.id === orderId ? { ...t, status: 'available', order: null } : t));

      try {
        const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.details || err.error || `Failed to delete order (${res.status})`);
        }
      } catch (e) {
        console.warn('Delete API unavailable; order was removed in demo mode.', e);
      }
    }
  };

  const settlePayLaterOrder = async (orderId, paymentMethod) => {
    const paidAt = new Date().toISOString();
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correction: true, paymentStatus: 'Paid', paymentMethod, paidAt }),
      });
      if (!res.ok) throw new Error(`Failed to settle payment (${res.status})`);
      const updatedOrder = await res.json();
      setOrderHistory(prev => prev.map(order => order.id === orderId ? updatedOrder : order));
      return updatedOrder;
    } catch (error) {
      const existingOrder = orderHistory.find(order => order.id === orderId);
      if (!existingOrder) throw error;
      const updatedOrder = { ...existingOrder, paymentStatus: 'Paid', paymentMethod, paidAt, closedAt: formatIstTime() };
      setOrderHistory(prev => prev.map(order => order.id === orderId ? updatedOrder : order));
      console.warn('Payment API unavailable; payment was recorded in demo mode.', error);
      return updatedOrder;
    }
  };

  const logOldSettlement = async (customerName, amount, paymentMethod, extraData = {}) => {
    const res = await fetch(`${API_BASE}/api/orders/old-settlement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        amount,
        paymentMethod,
        ...extraData,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || `Failed to log settlement (${res.status})`);
    }

    const createdOrder = await res.json();
    setOrderHistory(prev => [createdOrder, ...prev]);
    return createdOrder;
  };
  const freeTable = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table?.order) closeOrder(table.order.id);
  };

  const updateTableStatus = async (tableId, newStatus) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: newStatus } : t));
    try {
      await fetch(`${API_BASE}/api/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch { /* ignore */ }
  };

  const addMenuItem = async (item) => {
    const tempId = Date.now();
    // Optimistic update
    setMenuItems(prev => [...prev, { ...item, id: tempId, enabled: true, availableOnline: true }]);
    try {
      const res = await fetch(`${API_BASE}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.details || errBody.error || `HTTP ${res.status}`);
      }
      const savedItem = await res.json();
      // Replace temp item with real DB item (gets real id)
      setMenuItems(prev => prev.map(i => i.id === tempId ? savedItem : i));
    } catch (e) {
      console.error('addMenuItem failed — rolling back:', e.message);
      // Rollback optimistic update
      setMenuItems(prev => prev.filter(i => i.id !== tempId));
      throw e; // re-throw so the UI can show an error
    }
  };

  const removeMenuItem = async (itemId) => {
    const snapshot = menuItems.find(i => i.id === itemId);
    // Optimistic update
    setMenuItems(prev => prev.filter(item => item.id !== itemId));
    try {
      const res = await fetch(`${API_BASE}/api/menu/${itemId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.details || errBody.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      console.error('removeMenuItem failed — rolling back:', e.message);
      // Rollback: put the item back
      if (snapshot) setMenuItems(prev => [...prev, snapshot]);
      throw e;
    }
  };

  const toggleMenuItemEnabled = async (itemId) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    const nextEnabled = !item.enabled;
    // Optimistic update
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, enabled: nextEnabled } : i));
    try {
      const res = await fetch(`${API_BASE}/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.details || errBody.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      console.error('toggleMenuItemEnabled failed — rolling back:', e.message);
      // Rollback
      setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, enabled: item.enabled } : i));
      throw e;
    }
  };

  const toggleMenuItemOnline = async (itemId) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    const nextOnline = !item.availableOnline;
    // Optimistic update
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, availableOnline: nextOnline } : i));
    try {
      const res = await fetch(`${API_BASE}/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableOnline: nextOnline })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.details || errBody.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      console.error('toggleMenuItemOnline failed — rolling back:', e.message);
      // Rollback
      setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, availableOnline: item.availableOnline } : i));
      throw e;
    }
  };

  const updateMenuItem = async (itemId, updatedItem) => {
    const snapshot = menuItems.find(i => i.id === itemId);
    if (!snapshot) return;
    // Optimistic update
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updatedItem } : i));
    try {
      const res = await fetch(`${API_BASE}/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.details || errBody.error || `HTTP ${res.status}`);
      }
      const savedItem = await res.json();
      setMenuItems(prev => prev.map(i => i.id === itemId ? savedItem : i));
    } catch (e) {
      console.error('updateMenuItem failed — rolling back:', e.message);
      // Rollback
      setMenuItems(prev => prev.map(i => i.id === itemId ? snapshot : i));
      throw e;
    }
  };

  const reorderMenuItems = async (reorderedItems) => {
    // Optimistically update the UI
    setMenuItems(reorderedItems);

    // Prepare payload
    const payload = reorderedItems.map((item, index) => ({
      id: item.id,
      orderIndex: index
    }));

    try {
      const res = await fetch(`${API_BASE}/api/menu/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.details || errBody.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      console.error('reorderMenuItems failed:', e.message);
      // Let the auto-refresh pull the real state if it failed, or we could rollback manually
      throw e;
    }
  };

  const addFoodCategory = async (name) => {
    try {
      const res = await fetch(`${API_BASE}/api/menu-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add category');
      }
      const newCat = await res.json();
      setFoodCategories(prev => [...prev, newCat]);
      return newCat;
    } catch (e) {
      console.error('addFoodCategory error:', e);
      throw e;
    }
  };

  const removeFoodCategory = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/menu-categories/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete category');
      }
      setFoodCategories(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error('removeFoodCategory error:', e);
      throw e;
    }
  };

  const addGroceryItem = async (name, quantity, unit) => {
    const tempId = Date.now();
    setGroceryItems(prev => [...prev, { id: tempId, name, quantity, unit, purchased: false }]);
    try {
      const res = await fetch(`${API_BASE}/api/grocery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity, unit })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const savedItem = await res.json();
      setGroceryItems(prev => prev.map(i => i.id === tempId ? savedItem : i));
    } catch (e) {
      console.error("Failed to save grocery item to database.", e);
    }
  };

  const toggleGroceryItem = async (itemId) => {
    const item = groceryItems.find(i => i.id === itemId);
    if (item) {
      setGroceryItems(prev => prev.map(i => i.id === itemId ? { ...i, purchased: !i.purchased } : i));
      try {
        await fetch(`${API_BASE}/api/grocery/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purchased: !item.purchased })
        });
      } catch { /* ignore */ }
    }
  };

  const removeGroceryItem = async (itemId) => {
    setGroceryItems(prev => prev.filter(item => item.id !== itemId));
    try {
      const res = await fetch(`${API_BASE}/api/grocery/${itemId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch (e) {
      console.error("Failed to delete grocery item from database.", e);
    }
  };

  const clearPurchasedGrocery = () => {
    setGroceryItems(prev => prev.filter(item => !item.purchased));
  };

  const addStoreItem = async (item) => {
    const tempId = `G${Date.now()}`;
    setStoreInventory(prev => [{ ...item, id: tempId }, ...prev]);
    try {
      const res = await fetch(`${API_BASE}/api/store-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, id: tempId })
      });
      if (res.ok) {
        const saved = await res.json();
        setStoreInventory(prev => prev.map(i => i.id === tempId ? saved : i));
      }
    } catch (e) { console.error('Failed to add store item', e); }
  };

  const updateStoreItemStock = async (id, newStock, buyingCost = undefined) => {
    setStoreInventory(prev => prev.map(item => item.id === id ? { ...item, stock: Math.max(0, newStock), ...(buyingCost !== undefined && { buyingCost }) } : item));
    try {
      await fetch(`${API_BASE}/api/store-products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: Math.max(0, newStock), ...(buyingCost !== undefined && { buyingCost }) })
      });
    } catch (e) { console.error('Failed to update stock', e); }
  };

  const checkoutStoreOrder = async (cartItems, paymentMethod = 'Cash') => {
    const now = new Date();
    const tempId = `GRO-${Date.now()}`;
    const order = {
      id: tempId,
      orderNumber: '...',
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        buyingCost: item.buyingCost || 0
      })),
      totalAmount: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      paymentMethod,
      orderDate: now.toISOString()
    };

    setStoreOrders(prev => [order, ...prev]);
    setStoreInventory(prev => prev.map(product => {
      const cartItem = cartItems.find(item => item.id === product.id);
      return cartItem
        ? { ...product, stock: Math.max(0, product.stock - cartItem.quantity) }
        : product;
    }));

    try {
      const res = await fetch(`${API_BASE}/api/store-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (res.ok) {
        const saved = await res.json();
        setStoreOrders(prev => prev.map(o => o.id === tempId ? saved : o));
      }
    } catch (e) { console.error('Failed to checkout store order', e); }

    return tempId;
  };

  const placeSupplierOrder = async (supplierName, cartItems) => {
    const tempId = `SUP-${Date.now()}`;
    const order = {
      id: tempId,
      supplierName,
      status: 'Ordered',
      paymentStatus: 'Unpaid',
      orderDate: new Date().toISOString(),
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        buyingCost: item.buyingCost || 0,
        product: { name: item.name } // for UI optimism
      })),
      totalAmount: cartItems.reduce((sum, item) => sum + (item.buyingCost || 0) * item.quantity, 0)
    };

    setSupplierOrders(prev => [order, ...prev]);

    try {
      const res = await fetch(`${API_BASE}/api/supplier-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (res.ok) {
        const saved = await res.json();
        setSupplierOrders(prev => prev.map(o => o.id === tempId ? saved : o));
      }
    } catch (e) { console.error('Failed to place supplier order', e); }
  };

  const updateSupplierOrder = async (orderId, updates) => {
    setSupplierOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));

    if (updates.status === 'Received') {
      const order = supplierOrders.find(o => o.id === orderId);
      if (order) {
        setStoreInventory(prev => prev.map(product => {
          const item = order.items.find(i => i.productId === product.id);
          if (item) {
            return { ...product, stock: product.stock + item.quantity, buyingCost: item.buyingCost };
          }
          return product;
        }));
      }
    }

    try {
      await fetch(`${API_BASE}/api/supplier-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) { console.error('Failed to update supplier order', e); }
  };

  return (
    <AppContext.Provider value={{
      appMode, setAppMode,
      tables, activeOrders, orderHistory, menuItems, groceryItems, storeInventory, storeOrders, supplierOrders, dataErrors, foodCategories,
      refreshData,
      placeOrder, updateOrder, correctHistoricalOrder, settlePayLaterOrder, logOldSettlement, updateOrderItemQuantity, markOrderReady, closeOrder, deleteOrder, freeTable, updateTableStatus,
      addMenuItem, removeMenuItem, toggleMenuItemEnabled, toggleMenuItemOnline, updateMenuItem, reorderMenuItems, addFoodCategory, removeFoodCategory,
      addGroceryItem, toggleGroceryItem, removeGroceryItem, clearPurchasedGrocery,
      addStoreItem, updateStoreItemStock, checkoutStoreOrder, placeSupplierOrder, updateSupplierOrder,
      sidebarOpen, sidebarMinimized, toggleSidebarMinimized, toggleSidebarOpen, closeSidebar,
      formatIstDate, formatIstTime, getIstDateInputValue
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

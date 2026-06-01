import { createContext, useContext, useState, useEffect, useRef } from 'react';

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

// No hardcoded fallback — always load from the database
const initialMenuItems = [];

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

export function AppProvider({ children }) {
  const [appMode, setAppMode] = useState('restaurant'); // 'restaurant' | 'grocery'

  const [tables, setTables] = useState(initialTables);
  const [paymentMethods, setPaymentMethods] = useState({});

  const handlePaymentChange = (orderId, method) => {
    setPaymentMethods(prev => ({ ...prev, [orderId]: method }));
  };

  const [activeOrders, setActiveOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [groceryItems, setGroceryItems] = useState([]);
  const [storeInventory, setStoreInventory] = useState([]);
  const [storeOrders, setStoreOrders] = useState([]);
  const [dataErrors, setDataErrors] = useState({});
  const isRefreshingRef = useRef(false);
  const pendingClosedOrderIdsRef = useRef(new Set());

  const loadBackendData = async () => {
    const responses = {};
    const errors = {};
    const endpoints = [
      ['menu', `${API_BASE}/api/menu`],
      ['tables', `${API_BASE}/api/tables`],
      ['orders', `${API_BASE}/api/orders`],
      ['grocery', `${API_BASE}/api/grocery`],
    ];

    for (const [key, endpoint] of endpoints) {
      try {
        const res = await fetch(endpoint);
        if (res && res.ok) {
          responses[key] = await res.json();
        } else {
          const err = await res?.json?.().catch(() => ({}));
          errors[key] = err?.details || err?.error || `Failed to load ${key}`;
          responses[key] = null;
        }
      } catch (err) {
        errors[key] = err.message || `Failed to load ${key}`;
        responses[key] = null;
      }
    }
    setDataErrors(errors);

    if (responses.menu) setMenuItems(responses.menu);
    if (responses.tables) setTables(responses.tables);
    if (responses.orders) {
      const allOrders = responses.orders;
      const backendActiveOrders = allOrders.filter(o =>
        !isClosedOrder(o) && !pendingClosedOrderIdsRef.current.has(o.id)
      );
      setActiveOrders(prev =>
        mergeLocalActiveOrders(prev, backendActiveOrders)
          .filter(order => !pendingClosedOrderIdsRef.current.has(order.id))
      );
      setOrderHistory(allOrders.filter(isClosedOrder));
    }
    if (responses.grocery) setGroceryItems(responses.grocery);
  };

  // Fetch initial data from backend (fallback to defaults if backend not ready)
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        await loadBackendData();
      } catch (err) {
        console.error("Backend not reachable. Falling back to local state.", err);
      }
    };
    fetchBackendData();
  }, []);

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

  // Refresh all data from the backend
  const refreshData = async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      await loadBackendData();
    } catch (err) {
      console.error('Refresh failed', err);
    } finally {
      isRefreshingRef.current = false;
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData();
    }, 15000);

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
  }, []);

  const buildLocalOrder = (cartItems, tableId, paymentMethod = 'Cash', customerName = '', id = `local-${Date.now()}`) => {
    const now = new Date();
    const addOnTotal = (item) => ((item.addOns?.Roti || 0) * 15) + ((item.addOns?.Curry || 0) * 40);
    const total = cartItems.reduce((sum, item) => sum + (item.price + addOnTotal(item)) * item.quantity, 0);
    return {
      id,
      orderNumber: Date.now().toString().slice(-6),
      table: tableId ? `Table ${tables.find(t => t.id === tableId)?.name || tableId}` : 'Takeaway',
      itemList: cartItems.map(item => `${item.name} x${item.quantity}`),
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

  const removeOptimisticOrder = (orderId, tableId) => {
    setActiveOrders(prev => prev.filter(order => order.id !== orderId));
    if (tableId) {
      setTables(prev => prev.map(t =>
        t.id === tableId && t.order?.id === orderId
          ? { ...t, status: 'available', order: null }
          : t
      ));
    }
  };

  // Place a new order
  const placeOrder = async (cartItems, tableId, paymentMethod = 'Cash', customerName = '') => {
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
        removeOptimisticOrder(tempId, tableId);
        throw new Error(err.details || err.error || `Failed to place order (${res.status})`);
      }
    } catch (e) {
      console.error('Failed to place order via API', e);
      removeOptimisticOrder(tempId, tableId);
      throw e;
    }
  };

  const updateOrder = async (orderId, cartItems, tableId, customerName = undefined) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: tableId || null,
          customerName,
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
    return null;
  };

  const correctHistoricalOrder = async (orderId, corrections) => {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correction: true,
        ...corrections,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || `Failed to update order (${res.status})`);
    }

    const updatedOrder = await res.json();
    setOrderHistory(prev => prev.map(order => order.id === orderId ? updatedOrder : order));
    return updatedOrder;
  };

  const updateOrderItemQuantity = (orderId, nameToUpdate, delta, isAddOn = null, addOnDelta = 0) => {
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
    } catch (e) {}
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
        console.error('closeOrder API error', e);
        pendingClosedOrderIdsRef.current.delete(orderId);
        setOrderHistory(prev => prev.filter(o => o.id !== orderId));
        setActiveOrders(prev => prev.some(o => o.id === orderId) ? prev : [order, ...prev]);
        setTables(prev => prev.map(t =>
          order.table === `Table ${t.name}` ? { ...t, status: 'occupied', order } : t
        ));
        throw e;
      }
    }
  };

  const settlePayLaterOrder = async (orderId, paymentMethod) => {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correction: true,
        paymentStatus: 'Paid',
        paymentMethod,
        paidAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || `Failed to settle payment (${res.status})`);
    }

    const updatedOrder = await res.json();
    setOrderHistory(prev => prev.map(order => order.id === orderId ? updatedOrder : order));
    return updatedOrder;
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
    } catch (e) {}
  };

  const addMenuItem = async (item) => {
    const tempId = Date.now();
    // Optimistic update
    setMenuItems(prev => [...prev, { ...item, id: tempId, enabled: true }]);
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
      } catch (e) {}
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

  const addStoreItem = (item) => {
    setStoreInventory(prev => [{ ...item, id: `G${Date.now()}` }, ...prev]);
  };

  const updateStoreItemStock = (id, newStock) => {
    setStoreInventory(prev => prev.map(item => item.id === id ? { ...item, stock: Math.max(0, newStock) } : item));
  };
  
  const checkoutStoreOrder = (cartItems, paymentMethod = 'Cash') => {
    const now = new Date();
    const order = {
      id: `GRO-${Date.now()}`,
      orderNumber: '...',
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      paymentMethod,
      date: formatIstDate(now),
      time: formatIstTime(now),
      createdAt: now.toISOString(),
    };

    setStoreOrders(prev => [order, ...prev]);
    setStoreInventory(prev => prev.map(product => {
      const cartItem = cartItems.find(item => item.id === product.id);
      return cartItem
        ? { ...product, stock: Math.max(0, product.stock - cartItem.quantity) }
        : product;
    }));

    return order.id;
  };

  return (
    <AppContext.Provider value={{
      appMode, setAppMode,
      tables, activeOrders, orderHistory, menuItems, groceryItems, storeInventory, storeOrders, dataErrors,
      refreshData,
      placeOrder, updateOrder, correctHistoricalOrder, settlePayLaterOrder, updateOrderItemQuantity, markOrderReady, closeOrder, freeTable, updateTableStatus,
      addMenuItem, removeMenuItem, toggleMenuItemEnabled, updateMenuItem,
      addGroceryItem, toggleGroceryItem, removeGroceryItem, clearPurchasedGrocery,
      addStoreItem, updateStoreItemStock, checkoutStoreOrder,
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

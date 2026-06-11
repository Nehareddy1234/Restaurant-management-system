import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Percent, Users, Award, TrendingDown, Clock, Store, Calendar, Sparkles, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Analytics.css'; // Reusing the same styles as Restaurant Analytics

const COLORS = ['#27ae60', '#f39c12', '#2980b9', '#8e44ad', '#e74c3c', '#16a085'];
const PIE_COLORS = ['#3498db', '#9b59b6', '#e74c3c', '#f1c40f', '#2ecc71'];

function getIstDateKey(value = new Date()) {
  const dateObj = new Date(value);
  if (isNaN(dateObj)) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(dateObj);

  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export default function GroceryAnalytics() {
  const { storeOrders, storeInventory } = useApp();
  const [dateFilter, setDateFilter] = useState('All');

  // Timezone-safe local date parsing
  const parseLocalDate = (dateStr) => {
    if (!dateStr || dateStr === 'Today') {
      return new Date();
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  };

  const getActualDate = (dateStr) => {
    if (!dateStr || dateStr === 'Today') {
      return getIstDateKey();
    }
    return dateStr;
  };

  const filteredHistory = dateFilter === 'All' 
    ? storeOrders 
    : storeOrders.filter(o => getActualDate(o.date) === dateFilter);

  // 1. Calculate General Financial Metrics
  const totalRevenue = filteredHistory.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
  const totalOrders = filteredHistory.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  
  let actualCOGS = 0;
  let totalItemsSold = 0;
  filteredHistory.forEach(order => {
    order.items.forEach(item => {
      totalItemsSold += item.quantity;
      actualCOGS += (item.buyingCost || 0) * item.quantity;
    });
  });

  const netProfit = totalRevenue - actualCOGS;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;


  // Find most popular category
  const categoryCounts = {};
  filteredHistory.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + item.quantity;
      });
    }
  });
  
  // 2. Prepare Data: Item Performance (Top & Bottom)
  const itemPerformance = {};
  storeInventory.forEach(m => {
    itemPerformance[m.name] = { name: m.name, qty: 0, revenue: 0, category: m.category, price: m.price };
  });

  filteredHistory.forEach(order => {
    order.items.forEach(item => {
      if (itemPerformance[item.name]) {
        itemPerformance[item.name].qty += item.quantity;
        itemPerformance[item.name].revenue += (itemPerformance[item.name].price * item.quantity);
      } else {
        itemPerformance[item.name] = { name: item.name, qty: item.quantity, revenue: (item.price * item.quantity), category: item.category, price: item.price };
      }
    });
  });

  const performanceArray = Object.values(itemPerformance).filter(i => i.qty > 0);
  performanceArray.sort((a, b) => b.revenue - a.revenue);
  
  const topItems = performanceArray.slice(0, 5);
  const bottomItems = [...performanceArray].sort((a, b) => a.revenue - b.revenue).slice(0, 5);

  // 3. Prepare Data: Revenue Trends (last 7 days including today)
  const revenueByDate = {};
  const costByDate = {};
  
  storeOrders.forEach(order => {
    const d = order.date || 'Today';
    revenueByDate[d] = (revenueByDate[d] || 0) + (order.totalAmount || order.total || 0);
    order.items.forEach(item => {
      costByDate[d] = (costByDate[d] || 0) + ((item.buyingCost || 0) * item.quantity);
    });
  });

  const revenueChartData = Object.entries(revenueByDate)
    .map(([date, revenue]) => ({
      date: date === 'Today' ? 'Today' : date.substring(5),
      Revenue: revenue,
      Profit: Math.round(revenue - (costByDate[date] || 0)) // Actual profit
    }))
    .reverse();

  // 4. Prepare Data: Sales by Category
  const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  // 5. Payment Methods
  const paymentMethodData = { Cash: 0, Card: 0, UPI: 0 };
  filteredHistory.forEach(order => {
    const total = order.totalAmount || order.total || 0;
    if (order.paymentMethod && paymentMethodData[order.paymentMethod] !== undefined) {
      paymentMethodData[order.paymentMethod] += total;
    } else {
      paymentMethodData['Cash'] += total;
    }
  });

  // 6. Sales by Day of Week (All-Time)
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayOfWeekData = {
    Mon: { name: 'Mon', 'Staples': 0, 'Dairy': 0, 'Snacks': 0, 'Beverages': 0, 'Other': 0 },
    Tue: { name: 'Tue', 'Staples': 0, 'Dairy': 0, 'Snacks': 0, 'Beverages': 0, 'Other': 0 },
    Wed: { name: 'Wed', 'Staples': 0, 'Dairy': 0, 'Snacks': 0, 'Beverages': 0, 'Other': 0 },
    Thu: { name: 'Thu', 'Staples': 0, 'Dairy': 0, 'Snacks': 0, 'Beverages': 0, 'Other': 0 },
    Fri: { name: 'Fri', 'Staples': 0, 'Dairy': 0, 'Snacks': 0, 'Beverages': 0, 'Other': 0 },
    Sat: { name: 'Sat', 'Staples': 0, 'Dairy': 0, 'Snacks': 0, 'Beverages': 0, 'Other': 0 },
    Sun: { name: 'Sun', 'Staples': 0, 'Dairy': 0, 'Snacks': 0, 'Beverages': 0, 'Other': 0 },
  };

  storeOrders.forEach(order => {
    const dateObj = parseLocalDate(order.date);
    let dayIndex = dateObj.getDay() - 1;
    if (dayIndex === -1) dayIndex = 6; // Sunday
    const dayName = daysOfWeek[dayIndex];
    
    order.items.forEach(item => {
      let cat = item.category || 'Other';
      if (dayOfWeekData[dayName][cat] === undefined) {
         cat = 'Other';
      }
      dayOfWeekData[dayName][cat] += item.quantity;
    });
  });
  
  const finalDayOfWeekData = daysOfWeek.map(d => dayOfWeekData[d]);

  return (
    <div className="analytics-page">
      <header className="analytics-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Store Financials</h1>
          <p className="text-muted">Grocery store financial performance & sales analytics</p>
        </div>
        <div className="date-filter-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg, #fff)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Calendar size={18} className="text-muted" />
          <input 
            type="date"
            value={dateFilter === 'All' ? '' : dateFilter}
            onChange={(e) => setDateFilter(e.target.value || 'All')}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}
          />
          <button 
            className={`btn ${dateFilter === 'All' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
            onClick={() => setDateFilter('All')}
          >
            Till Date
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card card">
          <div className="kpi-icon" style={{ background: 'rgba(39, 174, 96, 0.1)', color: '#27ae60' }}>
            <DollarSign size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Gross Revenue</span>
            <h2 className="kpi-value">₹{totalRevenue.toLocaleString()}</h2>
            <span className="kpi-trend positive"><TrendingUp size={14} /> Tracking well</span>
          </div>
        </div>

        <div className="kpi-card card">
          <div className="kpi-icon" style={{ background: 'rgba(41, 128, 185, 0.1)', color: '#2980b9' }}>
            <Percent size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Net Profit ({profitMargin}%)</span>
            <h2 className="kpi-value">₹{Math.round(netProfit).toLocaleString()}</h2>
            <span className="kpi-trend" style={{ color: netProfit > 0 ? 'var(--success)' : 'var(--danger)', fontSize: '0.75rem' }}>Buying Cost: ₹{Math.round(actualCOGS).toLocaleString()}</span>
          </div>
        </div>

        <div className="kpi-card card">
          <div className="kpi-icon" style={{ background: 'rgba(243, 156, 18, 0.1)', color: '#f39c12' }}>
            <Store size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Items Sold</span>
            <h2 className="kpi-value">{totalItemsSold.toLocaleString()}</h2>
          </div>
        </div>

        <div className="kpi-card card">
          <div className="kpi-icon" style={{ background: 'rgba(142, 68, 173, 0.1)', color: '#8e44ad' }}>
            <ShoppingBag size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Average Order Size</span>
            <h2 className="kpi-value">₹{avgOrderValue.toLocaleString()}</h2>
          </div>
        </div>
      </div>

      <div className="charts-grid top-charts">
        {/* Area Chart: Revenue Trend (Till Date Only) */}
        {dateFilter === 'All' && revenueChartData.length > 0 && (
          <div className="chart-card card area-chart-card">
            <h2>Revenue & Profit Margin Trend (Till Date)</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#27ae60" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#27ae60" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2980b9" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2980b9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value, name) => [`₹${value}`, name]} contentStyle={{ background: '#2c3e50', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#27ae60" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="Profit" stroke="#2980b9" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="chart-card card pie-chart-card" style={dateFilter !== 'All' ? { gridColumn: 'span 2' } : {}}>
          <h2>Revenue by Payment Method</h2>
          <div className="type-stats" style={{ marginTop: '2rem' }}>
            <div className="stat-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(23, 162, 184, 0.1)', padding: '1.5rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: '#17a2b8', fontWeight: 600 }}>UPI</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '0.5rem' }}>₹{paymentMethodData.UPI.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(111, 66, 193, 0.1)', padding: '1.5rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: '#6f42c1', fontWeight: 600 }}>Card</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '0.5rem' }}>₹{paymentMethodData.Card.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(40, 167, 69, 0.1)', padding: '1.5rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: '#28a745', fontWeight: 600 }}>Cash</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginTop: '0.5rem' }}>₹{paymentMethodData.Cash.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Performance Tables */}
      <div className="tables-grid">
        <div className="performance-card card">
          <div className="card-header-flex">
            <h2>Top Performing Items</h2>
            <Award className="icon-gold" size={20} />
          </div>
          <div className="table-responsive">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Qty Sold</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, i) => (
                  <tr key={i}>
                    <td className="item-name-cell">{item.name}</td>
                    <td><span className="badge-cat">{item.category}</span></td>
                    <td><strong>{item.qty}</strong></td>
                    <td className="text-right revenue-text">₹{item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {topItems.length === 0 && (
                  <tr><td colSpan="4" className="text-center text-muted">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="performance-card card">
          <div className="card-header-flex">
            <h2>Low Performing Items</h2>
            <TrendingDown className="icon-danger" size={20} />
          </div>
          <div className="table-responsive">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Qty Sold</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {bottomItems.map((item, i) => (
                  <tr key={i}>
                    <td className="item-name-cell">{item.name}</td>
                    <td><span className="badge-cat">{item.category}</span></td>
                    <td><strong>{item.qty}</strong></td>
                    <td className="text-right revenue-text">₹{item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {bottomItems.length === 0 && (
                  <tr><td colSpan="4" className="text-center text-muted">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="charts-grid bottom-charts">
        {/* Stacked Bar Chart: Day of Week Trends */}
        <div className="chart-card card bar-chart-card">
          <h2>Sales by Day of Week (Qty)</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={finalDayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#2c3e50', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Staples" stackId="a" fill="#e84118" />
                <Bar dataKey="Dairy" stackId="a" fill="#0097e6" />
                <Bar dataKey="Snacks" stackId="a" fill="#8c7ae6" />
                <Bar dataKey="Beverages" stackId="a" fill="#4cd137" />
                <Bar dataKey="Other" stackId="a" fill="#e1b12c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Sales Category Breakdown */}
        {pieData.length > 0 && (
          <div className="chart-card card pie-chart-card" style={{ gridColumn: 'span 2' }}>
            <h2>Total Sales by Category (Qty)</h2>
            <div className="chart-container pie-container">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#2c3e50', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      {/* Low Stock Alerts */}
      {(() => {
        const lowStockItems = storeInventory.filter(item => item.stock < (item.lowStockThreshold || 10));
        if (lowStockItems.length === 0) return null;
        return (
          <div className="chart-card card" style={{ marginTop: '1.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} style={{ color: 'var(--danger)' }} /> Low Stock Alerts ({lowStockItems.length} items)
            </h2>
            <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
              <table className="history-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Item</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Threshold</th>
                    <th>Buying Cost</th>
                    <th>Selling Price</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map(item => (
                    <tr key={item.id}>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>{item.name}</td>
                      <td><span className="badge-cat">{item.category}</span></td>
                      <td><strong style={{ color: 'var(--danger)' }}>{item.stock}</strong></td>
                      <td>{item.lowStockThreshold || 10}</td>
                      <td>₹{item.buyingCost || 0}</td>
                      <td>₹{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

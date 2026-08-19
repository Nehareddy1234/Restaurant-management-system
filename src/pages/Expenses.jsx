import { useState } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Search,
  Filter,
  Calendar,
  Tag,
  TrendingDown,
  FileText,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import './Expenses.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';


const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;
const API_BASE = isCapacitor ? 'https://nehaskitchen.vercel.app' : '';

const CATEGORIES = [
  { name: 'Ingredients', color: '#ff7675', bg: 'rgba(255, 118, 117, 0.15)' },
  { name: 'Rent', color: '#00b894', bg: 'rgba(0, 184, 148, 0.15)' },
  { name: 'Utilities', color: '#0984e3', bg: 'rgba(9, 132, 227, 0.15)' },
  { name: 'Salaries', color: '#6c5ce7', bg: 'rgba(108, 92, 231, 0.15)' },
  { name: 'Marketing', color: '#fdcb6e', bg: 'rgba(253, 203, 110, 0.15)' },
  { name: 'Miscellaneous', color: '#b2bec3', bg: 'rgba(178, 190, 195, 0.15)' },
  { name: 'Pipes', color: '#e17055', bg: 'rgba(225, 112, 85, 0.15)' },
];

const DEMO_EXPENSES = [
  { id: 'demo-expense-001', description: 'Fresh vegetables and dairy', category: 'Ingredients', amount: 6850, date: new Date().toISOString() },
  { id: 'demo-expense-002', description: 'Kitchen gas refill', category: 'Utilities', amount: 1200, date: new Date(Date.now() - 86400000).toISOString() },
  { id: 'demo-expense-003', description: 'August restaurant rent', category: 'Rent', amount: 55000, date: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'demo-expense-004', description: 'Weekly staff payout', category: 'Salaries', amount: 28500, date: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'demo-expense-005', description: 'Instagram promotion', category: 'Marketing', amount: 2500, date: new Date(Date.now() - 5 * 86400000).toISOString() },
];

function getIstDateInputValue(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

function formatIstDate(value) {
  return new Date(value).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Expenses() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      try {
        const url = `${API_BASE}/api/expenses`;
        const res = await fetch(url);
        if (!res.ok) return DEMO_EXPENSES;
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Expenses API unavailable; showing demo expenses.', error);
        return DEMO_EXPENSES;
      }
    },
    staleTime: 1000 * 60,
  });

  const totalCount = expenses.length;

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Ingredients');
  const [date, setDate] = useState(() => getIstDateInputValue());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('Ingredients');
    setDate(getIstDateInputValue());
    setShowAddForm(false);
    setEditId(null);
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    setFormError('');
  };

  const handleEditClick = (exp) => {
    setDescription(exp.description);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setDate(getIstDateInputValue(new Date(exp.date)));
    setEditId(exp.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return;
    try {
      const isEdit = !!editId;
      const url = isEdit ? `${API_BASE}/api/expenses/${editId}` : `${API_BASE}/api/expenses`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          category,
          amount: parseFloat(amount),
          date,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to save expense (${res.status})`);
      }
      await res.json(); // response not used directly
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      resetForm();
    } catch (err) {
      console.error('Failed to save expense', err);
      setFormError(err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const res = await fetch(`${API_BASE}/api/expenses/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed to delete expense (${res.status})`);
        }
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
      } catch (err) {
        console.error('Failed to delete expense', err);
        setFormError(err.message);
      }
    }
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + (exp?.amount || 0), 0);
  const categoryTotals = CATEGORIES.reduce((acc, cat) => {
    const total = expenses.filter((exp) => exp?.category === cat.name).reduce((s, e) => s + (e?.amount || 0), 0);
    acc[cat.name] = total;
    return acc;
  }, {});
  const topCategory = expenses.length > 0
    ? Object.keys(categoryTotals).reduce((a, b) =>
        categoryTotals[a] > categoryTotals[b] ? a : b,
        CATEGORIES[0].name,
      )
    : CATEGORIES[0].name;

  const filteredExpenses = expenses.filter((exp) => {
    const desc = exp?.description || '';
    const matchesSearch = desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || exp?.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination controls (client-side since API returns full list)
  const totalPages = Math.ceil(filteredExpenses.length / limit) || 1;
  const pagedExpenses = filteredExpenses.slice((page - 1) * limit, page * limit);
  const goPrev = () => setPage((p) => Math.max(p - 1, 1));
  const goNext = () => setPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="expenses-page">
      <header className="expenses-header">
        <div>
          <h1>Expenses Management</h1>
          <p className="text-muted">Track store expenditures, bills, and resource allocations</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddForm(true); }}>
          <Plus size={18} style={{ marginRight: '0.4rem' }} /> Add Expense
        </button>
      </header>

      {/* Stats row */}
      <div className="expenses-stats-grid">
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(232, 65, 24, 0.1)', color: '#e84118' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Expenditures</p>
            <h2 className="stat-value">₹{totalSpent.toLocaleString('en-IN')}</h2>
            <span className="stat-sub">Across all recorded bills</span>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(108, 92, 231, 0.1)', color: '#6c5ce7' }}>
            <TrendingDown size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Highest Cost Center</p>
            <h2 className="stat-value">{topCategory}</h2>
            <span className="stat-sub">₹{categoryTotals[topCategory]?.toLocaleString('en-IN') || 0} spent</span>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon" style={{ background: 'rgba(0, 184, 148, 0.1)', color: '#00b894' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Bills Filed</p>
            <h2 className="stat-value">{totalCount} Records</h2>
            <span className="stat-sub">Synced from the database</span>
          </div>
        </div>
      </div>

      <div className="expenses-main-layout">
        {/* Category Breakdown */}
        <div className="expenses-breakdown-card card">
          <h3>Expenditures Breakdown</h3>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            Spendings analyzed by categories
          </p>
          <div className="breakdown-list">
            {CATEGORIES.map((cat) => {
              const amount = categoryTotals[cat.name] || 0;
              const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
              return (
                <div key={cat.name} className="breakdown-item">
                  <div className="breakdown-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="category-dot" style={{ background: cat.color }} />
                      <strong style={{ fontSize: '0.875rem' }}>{cat.name}</strong>
                    </div>
                    <span className="breakdown-amount">
                      ₹{amount.toLocaleString('en-IN')} <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>({percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${percentage}%`, background: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses List & Form */}
        <div className="expenses-list-section">
          {formError && (
            <div className="expense-form-card card" style={{ borderColor: '#e84118', color: '#e84118' }}>{formError}</div>
          )}
          {showAddForm && (
            <div className="expense-form-card card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{editId ? 'Edit Expense' : 'Add New Expense'}</h3>
                <button className="close-btn" onClick={resetForm}>×</button>
              </div>
              <form onSubmit={handleAddExpense} className="expense-form">
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Water Bill, Staff lunch, etc." required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Amount (₹)</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount in Rupees" min="1" required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editId ? 'Update Record' : 'Save Record'}</button>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={resetForm}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="expense-table-card card">
            <div className="table-header-filters">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search description..." />
              </div>
              <div className="filter-box">
                <Filter size={16} className="filter-icon" />
                <select value={selectedCategoryFilter} onChange={(e) => setSelectedCategoryFilter(e.target.value)}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Expense Description</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center', width: '60px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertCircle size={32} />
                          <strong>Loading expenses...</strong>
                        </div>
                      </td>
                    </tr>
                  ) : pagedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertCircle size={32} />
                          <strong>No recorded expenses found</strong>
                          <span style={{ fontSize: '0.8rem' }}>Try clearing filters or add a new record!</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagedExpenses.map((exp) => {
                      const catInfo = CATEGORIES.find((c) => c.name === exp.category) || CATEGORIES[CATEGORIES.length - 1];
                      return (
                        <tr key={exp.id}>
                          <td>
                            <div className="expense-desc-cell">
                              <FileText size={16} className="desc-icon" />
                              <span>{exp?.description || 'No Description'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="category-badge" style={{ background: catInfo.bg, color: catInfo.color }}>
                              <Tag size={10} style={{ marginRight: '0.3rem' }} />
                              {exp?.category || 'Unknown'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exp?.date ? formatIstDate(exp.date) : 'N/A'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#e84118' }}>- ₹{(exp?.amount || 0).toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="edit-action-btn" onClick={() => handleEditClick(exp)} style={{ marginRight: '0.5rem', background: 'none', border: 'none', color: '#0984e3', cursor: 'pointer' }} title="Edit Expense"><Edit2 size={15} /></button>
                            <button className="delete-action-btn" onClick={() => handleDeleteExpense(exp.id)} title="Delete Expense"><Trash2 size={15} /></button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-controls" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={goPrev} disabled={page === 1}>Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button className="btn btn-outline" onClick={goNext} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

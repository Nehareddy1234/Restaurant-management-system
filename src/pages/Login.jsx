import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROLE_LABELS = {
  admin: { label: 'Admin', color: '#e84118', bg: '#fff0ed' },
  account_manager: { label: 'Account Manager', color: '#6f42c1', bg: '#f0ebff' },
  waiter: { label: 'Waiter', color: '#17a2b8', bg: '#e8f8fb' },
  customer: { label: 'Customer', color: '#28a745', bg: '#eafaf1' },
  store_manager: { label: 'Store Manager', color: '#d35400', bg: '#fdf0e6' },
};

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'admin', access: 'Full restaurant and grocery access' },
  { username: 'accounts', password: 'acc123', role: 'account_manager', access: 'Orders, payments, reports and inventory' },
  { username: 'waiter1', password: 'wait123', role: 'waiter', access: 'POS, tables and active orders' },
  { username: 'table1', password: 'cust123', role: 'customer', access: 'Customer menu and order placement' },
  { username: 'store_manager', password: 'store123', role: 'store_manager', access: 'Grocery sales and supplier management' },
];

export default function Login() {
  const { login, register, checkUsernameExists } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('waiter');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      setLoading(true);
      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        setError('Username already taken.');
        setLoading(false);
        return;
      }
      setTimeout(() => {
        const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(mockOtp);
        setShowOtpVerification(true);
        setLoading(false);
      }, 500);
    } else {
      setLoading(true);
      setTimeout(async () => {
        const result = await login(username, password);
        if (result.success) {
          const userRole = result.user.role;
          if (userRole === 'waiter') navigate('/pos');
          else if (userRole === 'customer') navigate('/customer-menu');
          else navigate('/');
        } else {
          setError(result.error);
        }
        setLoading(false);
      }, 400);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (enteredOtp.length !== 6) { setOtpError('Please enter a 6-digit OTP code.'); return; }
    if (enteredOtp !== generatedOtp) { setOtpError('Invalid OTP code. Please try again.'); return; }
    setLoading(true);
    setTimeout(async () => {
      const result = await register(username, password, displayName, role, phone, address);
      if (result.success) {
        const userRole = result.user.role;
        if (userRole === 'waiter') navigate('/pos');
        else if (userRole === 'customer') navigate('/customer-menu');
        else navigate('/');
      } else {
        setOtpError(result.error);
        setShowOtpVerification(false);
      }
      setLoading(false);
    }, 500);
  };

  const toggleMode = () => {
    setIsSignUp(prev => !prev);
    setError(''); setUsername(''); setPassword('');
    setDisplayName(''); setPhone(''); setAddress(''); setRole('waiter');
  };

  const fillDemoAccount = (account) => {
    setUsername(account.username);
    setPassword(account.password);
    setShowPw(false);
    setError('');
  };

  const inputStyle = {
    padding: '0.8rem 1rem', borderRadius: '10px',
    border: '1.5px solid #dee2e6', fontSize: '0.95rem',
    outline: 'none', transition: 'border-color 0.2s',
  };
  const focusRed = e => e.target.style.borderColor = '#e84118';
  const blurGray = e => e.target.style.borderColor = '#dee2e6';

  if (showOtpVerification) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', boxSizing: 'border-box',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #e84118, #c0392b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem auto', boxShadow: '0 8px 32px rgba(232,65,24,0.35)',
              fontSize: '1.8rem',
            }}>??</div>
            <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>Verification</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>Verify mobile to complete signup</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1a1a2e' }}>Enter OTP Code</h2>
            <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '1.5rem' }}>
              We've sent a 6-digit OTP to your phone: <strong style={{ color: '#1a1a2e' }}>{phone}</strong>
            </p>
            <div style={{
              background: '#eef2f7', borderLeft: '4px solid #00b894', borderRadius: '8px',
              padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem',
              color: '#2d3436', lineHeight: '1.4',
            }}>
              <div style={{ fontWeight: 700, color: '#00b894', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <span>?? SMS Simulator</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 500, background: 'rgba(0,184,148,0.15)', color: '#00b894', padding: '0.05rem 0.3rem', borderRadius: '4px' }}>Now</span>
              </div>
              Your OTP is <strong style={{ letterSpacing: '1px', color: '#e84118', fontSize: '0.95rem' }}>{generatedOtp}</strong>. Valid for 10 minutes.
            </div>
            {otpError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff0ed', color: '#e84118', border: '1px solid #f5c6bc', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 500 }}>
                <AlertCircle size={16} />{otpError}
              </div>
            )}
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#343a40', textAlign: 'center' }}>6-Digit OTP</label>
                <input
                  type="text" maxLength={6} value={enteredOtp} autoFocus required
                  onChange={e => { setEnteredOtp(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                  placeholder="------"
                  style={{ padding: '0.9rem', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '8px', textAlign: 'center', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={focusRed} onBlur={blurGray}
                />
              </div>
              <button type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.9rem', borderRadius: '12px', border: 'none', background: loading ? '#adb5bd' : 'linear-gradient(135deg, #e84118, #c0392b)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: loading ? 'none' : '0 4px 16px rgba(232,65,24,0.35)', transition: 'all 0.2s' }}>
                {loading ? 'Verifying...' : 'Verify & Sign Up'}
              </button>
              <button type="button" onClick={() => { setShowOtpVerification(false); setEnteredOtp(''); setOtpError(''); }} style={{ background: 'none', border: 'none', color: '#6c757d', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center', textDecoration: 'underline', marginTop: '0.25rem' }}>
                Go Back & Edit Info
              </button>
            </form>
          </div>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '1.5rem' }}>Restaurant Management System © 2026</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #e84118, #c0392b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 8px 32px rgba(232,65,24,0.35)', fontSize: '1.8rem' }}>???</div>
          <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>Restaurant Management System</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>Role-based restaurant operations</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1a1a2e' }}>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <p style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '1.75rem' }}>{isSignUp ? 'Fill in your details to register' : 'Enter your credentials to continue'}</p>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff0ed', color: '#e84118', border: '1px solid #f5c6bc', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 500 }}>
              <AlertCircle size={16} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Username */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#343a40' }}>Username</label>
              <input type="text" value={username} onChange={e => { setUsername(e.target.value); setError(''); }} placeholder="Enter your username" autoFocus required style={inputStyle} onFocus={focusRed} onBlur={blurGray} />
            </div>

            {/* Sign-up only fields */}
            {isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#343a40' }}>Display Name</label>
                <input type="text" value={displayName} onChange={e => { setDisplayName(e.target.value); setError(''); }} placeholder="Enter your name" required style={inputStyle} onFocus={focusRed} onBlur={blurGray} />
              </div>
            )}

            {isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#343a40' }}>Phone Number</label>
                <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }} placeholder="Enter your mobile number" required style={inputStyle} onFocus={focusRed} onBlur={blurGray} />
              </div>
            )}

            {isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#343a40' }}>Address</label>
                <textarea value={address} onChange={e => { setAddress(e.target.value); setError(''); }} placeholder="Enter your home address" rows={2} required style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} onFocus={focusRed} onBlur={blurGray} />
              </div>
            )}

            {isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#343a40' }}>Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, background: '#fff' }} onFocus={focusRed} onBlur={blurGray}>
                  <option value="admin">Admin</option>
                  <option value="account_manager">Account Manager</option>
                  <option value="waiter">Waiter</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            )}

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#343a40' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Enter your password" required style={{ ...inputStyle, width: '100%', padding: '0.8rem 2.75rem 0.8rem 1rem', boxSizing: 'border-box' }} onFocus={focusRed} onBlur={blurGray} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd', padding: '0.25rem' }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.9rem', borderRadius: '12px', border: 'none', background: loading ? '#adb5bd' : 'linear-gradient(135deg, #e84118, #c0392b)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: loading ? 'none' : '0 4px 16px rgba(232,65,24,0.35)', transition: 'all 0.2s' }}>
              <LogIn size={18} />
              {loading ? (isSignUp ? 'Signing up...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          {/* Mode toggle */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button type="button" onClick={toggleMode} style={{ background: 'none', border: 'none', color: '#e84118', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

          {/* Demo accounts — shown on Sign In only */}
          {!isSignUp && (
            <section style={{ marginTop: '1.5rem' }} aria-label="Demo login accounts">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.65rem' }}>
                <strong style={{ fontSize: '0.9rem', color: '#1a1a2e' }}>Explore demo roles</strong>
                <span style={{ fontSize: '0.72rem', color: '#6c757d' }}>Select to fill credentials</span>
              </div>
              <div style={{ display: 'grid', gap: '0.45rem' }}>
                {DEMO_ACCOUNTS.map((account) => {
                  const rs = ROLE_LABELS[account.role];
                  return (
                    <button key={account.username} type="button" onClick={() => fillDemoAccount(account)} title={`Use ${account.username} / ${account.password}`}
                      style={{ width: '100%', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.55rem', alignItems: 'center', padding: '0.55rem 0.65rem', borderRadius: '9px', border: `1px solid ${rs.color}33`, background: rs.bg, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                      <span style={{ color: rs.color, fontWeight: 700, fontSize: '0.75rem' }}>{rs.label}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', color: '#343a40', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.access}</span>
                        <span style={{ display: 'block', color: '#6c757d', fontSize: '0.72rem', marginTop: '0.1rem' }}>{account.username} / {account.password}</span>
                      </span>
                      <span style={{ color: rs.color, fontSize: '0.72rem', fontWeight: 700 }}>Use</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '1.5rem' }}>Restaurant Management System © 2026</p>
      </div>
    </div>
  );
}

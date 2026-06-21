import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate,
  useNavigate, useLocation
} from 'react-router-dom';
import {
  Clover, LayoutDashboard, Timer, Target, BookOpen,
  Sun, Moon, LogOut, Menu, X, Award, Flame, User,
  AlertCircle, ChevronDown, CheckSquare, Youtube, GitFork, MessageSquare, Activity, Code2
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import FocusTimerPage from './components/FocusTimer';
import GoalsPage from './pages/Goals';
import NotesPage from './pages/Notes';
import TodosPage from './pages/Todos';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import EmailVerificationPage from './pages/Verify';
import ProfilePage from './pages/Profile';
import CoursesPage from './pages/Courses';
import RoadmapsPage from './pages/Roadmaps';
import CoachPage from './pages/Coach';
import SmartGoalsPage from './pages/SmartGoals';
import StudyTasksIDE from './pages/StudyTasksIDE';

// ─── Constants ────────────────────────────────────────────────────────────────
export const API_URL = 'http://localhost:5000/api';

// ─── Contexts ─────────────────────────────────────────────────────────────────
export const AuthContext = createContext();
export const ThemeContext = createContext();

// ─── Date helper: "10 May 2026" ───────────────────────────────────────────────
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

// ─── Analog Clock ─────────────────────────────────────────────────────────────
function AnalogClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const s   = now.getSeconds();
  const m   = now.getMinutes();
  const h   = now.getHours() % 12;
  const sDeg = s * 6;
  const mDeg = m * 6 + s * 0.1;
  const hDeg = h * 30 + m * 0.5;

  const hand = (deg, len, w, color) => ({
    position: 'absolute',
    bottom: '50%',
    left: '50%',
    transformOrigin: 'bottom center',
    transform: `translateX(-50%) rotate(${deg}deg)`,
    width: `${w}px`,
    height: `${len}%`,
    backgroundColor: color,
    borderRadius: '2px 2px 0 0',
  });

  return (
    <div
      title={now.toLocaleTimeString()}
      className="relative w-9 h-9 rounded-full border-2 border-border bg-card shadow-sm flex items-center justify-center shrink-0"
    >
      {/* Hour marks */}
      {[...Array(12)].map((_, i) => {
        const a = i * 30;
        const r = (angle) => (angle - 90) * (Math.PI / 180);
        const x = 50 + 38 * Math.cos(r(a));
        const y = 50 + 38 * Math.sin(r(a));
        return (
          <div
            key={i}
            className="absolute w-px h-px rounded-full bg-muted-foreground/50"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
          />
        );
      })}
      <div style={hand(hDeg, 27, 2,   'hsl(var(--foreground))')} />
      <div style={hand(mDeg, 37, 1.5, 'hsl(var(--foreground))')} />
      <div style={hand(sDeg, 40, 1,   'hsl(var(--primary))')} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-primary z-10" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  if (!message) return null;
  const cls = {
    success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300',
    error:   'bg-destructive/10 border-destructive/20 text-destructive',
    info:    'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/30 text-blue-800 dark:text-blue-300',
  };
  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-full">
      <div className={`p-4 rounded-xl border shadow-lg flex items-center gap-3 ${cls[type] || cls.info}`}>
        <div className="shrink-0">
          {type === 'error'
            ? <AlertCircle className="w-5 h-5" />
            : <Clover className="w-5 h-5 text-primary animate-pulse" />}
        </div>
        <p className="text-xs font-semibold leading-relaxed flex-1">{message}</p>
        <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 transition-opacity">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Logout Confirm Dialog ────────────────────────────────────────────────────
function LogoutConfirm({ isOpen, onCancel, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 max-w-sm w-full shadow-lg">
        <div className="flex items-center gap-3 border-b border-border pb-3 mb-4">
          <div className="p-2 bg-destructive/10 text-destructive rounded-md">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-outfit font-bold text-lg text-foreground">Sign Out</h3>
            <p className="text-xs text-muted-foreground">Confirm account sign out</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Are you sure you want to log out of Code Clover? Your session and data are safe.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 text-xs font-semibold bg-secondary text-secondary-foreground border border-input rounded-md hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2 text-xs font-bold bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors uppercase tracking-wider">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Root Entry ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppProviders />
    </BrowserRouter>
  );
}

// ─── App Providers (state lives here) ─────────────────────────────────────────
function AppProviders() {
  const navigate = useNavigate();

  const [token, setToken]   = useState(localStorage.getItem('clover_token') || null);
  const [user,  setUser]    = useState(null);
  const [stats, setStats]   = useState({
    totalPresent: 0, totalDays: 0, attendancePercentage: 0,
    totalStudyHours: 0, streak: 0, badges: [],
  });
  const [loading,           setLoading]           = useState(true);
  const [theme,             setTheme]             = useState(localStorage.getItem('clover_theme') || 'light');
  const [toast,             setToast]             = useState({ show: false, message: '', type: 'info' });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const showToast = (msg, type = 'info') => setToast({ show: true, message: msg, type });

  // Auto-hide toast
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast(p => ({ ...p, show: false })), 4500);
    return () => clearTimeout(t);
  }, [toast.show]);

  // Theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('clover_theme', theme);
  }, [theme]);

  // Initial auth check
  useEffect(() => {
    (async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          setUser(await res.json());
          await fetchStats(token);
        } else {
          logout();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Handle tab closure
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (token) {
        // keepalive: true allows the request to finish even after the tab is closed
        fetch(`${API_URL}/smart-goals/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true
        }).catch(console.error);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [token]);

  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');

  const fetchStats = async (authToken = token) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/attendance/stats`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  const login = async (identifier, password) => {
    const res  = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('clover_token', data.token);
    setToken(data.token); setUser(data.user);
    await fetchStats(data.token);
    navigate('/dashboard');
  };

  const register = async (username, email, password) => {
    const res  = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('clover_token', data.token);
    setToken(data.token); setUser(data.user);
    await fetchStats(data.token);
    navigate('/dashboard');
  };

  const verify = async (code) => {
    const res  = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Verification failed');
    setUser(data.user);
    navigate('/dashboard');
  };

  const resendCode = async () => {
    if (!user) return;
    const res  = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Resend failed');
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_URL}/smart-goals/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    localStorage.removeItem('clover_token');
    setToken(null); setUser(null);
    setStats({ totalPresent: 0, totalDays: 0, attendancePercentage: 0, totalStudyHours: 0, streak: 0, badges: [] });
    navigate('/login');
  };

  const updateProfile = async (githubUsername) => {
    if (!token) return;
    const res  = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ github_username: githubUsername }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Profile update failed');
    setUser(data.user);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="relative flex items-center justify-center">
          <Clover className="w-14 h-14 text-primary animate-spin" />
          <div className="absolute w-20 h-20 border-t-2 border-r-2 border-primary rounded-full animate-spin" />
        </div>
        <span className="mt-4 text-base font-semibold tracking-wide text-muted-foreground">Loading Code Clover 🍀…</span>
      </div>
    );
  }

  const authCtx = {
    token, user, login, register, verify, resendCode,
    logout, updateProfile, stats, fetchStats, showToast,
    setUser,
  };

  // ── Unauthenticated ──
  if (!user) {
    return (
      <AuthContext.Provider value={authCtx}>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full filter blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-primary/5 rounded-full filter blur-2xl" />
            <button onClick={toggleTheme} className="absolute top-4 right-4 p-2.5 rounded-xl bg-card text-muted-foreground border border-border hover:text-primary transition-all">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <div className="w-full max-w-4xl">
              <Routes>
                <Route path="/register" element={<RegisterPage onToggle={() => navigate('/login')} />} />
                <Route path="*"         element={<LoginPage    onToggle={() => navigate('/register')} />} />
              </Routes>
            </div>
            {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />}
          </div>
        </ThemeContext.Provider>
      </AuthContext.Provider>
    );
  }

  // ── Email verification ──
  if (!user.is_verified) {
    return (
      <AuthContext.Provider value={authCtx}>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full filter blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-primary/5 rounded-full filter blur-2xl" />
            <button onClick={toggleTheme} className="absolute top-4 right-4 p-2.5 rounded-xl bg-card text-muted-foreground border border-border hover:text-primary transition-all">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <div className="w-full max-w-sm">
              <EmailVerificationPage />
            </div>
            {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />}
          </div>
        </ThemeContext.Provider>
      </AuthContext.Provider>
    );
  }

  // ── Authenticated ──
  return (
    <AuthContext.Provider value={authCtx}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <AppLayout
          user={user}
          stats={stats}
          theme={theme}
          toggleTheme={toggleTheme}
          onLogoutRequest={() => setShowLogoutConfirm(true)}
        />
        {toast.show && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
        )}
        <LogoutConfirm
          isOpen={showLogoutConfirm}
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={() => { setShowLogoutConfirm(false); logout(); }}
        />
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

// ─── Authenticated Layout ──────────────────────────────────────────────────────
function AppLayout({ user, stats, theme, toggleTheme, onLogoutRequest }) {
  const navigate           = useNavigate();
  const location           = useLocation();
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const profileRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard',      icon: LayoutDashboard },
    { path: '/courses',   label: 'Playlist Classes',icon: Youtube },
    { path: '/roadmaps',  label: 'Study Roadmaps',  icon: GitFork },
    { path: '/timer',     label: 'Focus Timer',    icon: Timer },
    // { path: '/todos',     label: 'Study Tasks',    icon: CheckSquare },
    { path: '/smart-goals',label: 'Smart Goals',  icon: Activity },
    { path: '/study-ide', label: 'Coding IDE Tasks', icon: Code2 },
    // { path: '/goals',     label: 'Learning Goals', icon: Target },
    { path: '/coach',     label: 'AI Coach Chat',  icon: MessageSquare },
    { path: '/notes',     label: 'Notes & AI Logs',icon: BookOpen },
  ];

  const pageTitles = {
    '/dashboard': `🍀 Welcome back, ${user.username}`,
    '/courses':   '🎥 Study Playlist Learning Center',
    '/roadmaps':  '🗺️ Developer Roadmaps progress',
    '/timer':     '⏱️ Advanced Study Focus Timer',
    '/todos':     '📋 Study Tasks Checklist',
    '/study-ide': '💻 Interactive Coding IDE',
    '/smart-goals':'🎯 Daily Smart Goals',
    '/goals':     '🎯 Learning Milestones',
    '/coach':     '🤖 Personalized AI Study Coach',
    '/notes':     '📋 Study Notes & AI Insight Logs',
    '/profile':   '👤 Profile Settings',
  };
  const pageTitle = pageTitles[location.pathname] || '🍀 Code Clover';

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-card border-r border-border transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:h-screen`}>

        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border shrink-0">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="p-1.5 bg-secondary text-primary rounded-xl">
              <Clover className="w-6 h-6 text-primary" />
            </div>
            <span className="font-outfit font-extrabold text-xl tracking-tight text-primary">Code Clover</span>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon     = item.icon;
            const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                className={`flex items-center gap-3.5 w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer label */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground text-center font-semibold uppercase tracking-widest">
            Code Clover v1.0
          </p>
        </div>
      </aside>

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">

        {/* ── Top Navbar ── */}
        <header className="flex items-center justify-between h-16 px-4 lg:px-6 bg-card/90 backdrop-blur border-b border-border sticky top-0 z-10 shrink-0">

          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl border border-border text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-outfit font-bold text-base hidden md:block text-foreground truncate max-w-xs">
              {pageTitle}
            </h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">

            {/* Analog Clock */}
            <AnalogClock />

            {/* Streak pill */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full border border-orange-500/20 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>{stats.streak}d</span>
            </div>

            {/* Badges pill */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>{stats.badges?.length || 1}</span>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-secondary transition-all"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border hover:bg-secondary transition-all"
                id="profile-menu-btn"
              >
                {user.profile_pic_url ? (
                  <img src={user.profile_pic_url} alt="avatar" className="w-7 h-7 rounded-md object-cover border border-border" />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-outfit font-bold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:block text-xs font-semibold text-foreground max-w-[90px] truncate">{user.username}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User info header */}
                  <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/40">
                    {user.profile_pic_url ? (
                      <img src={user.profile_pic_url} alt="avatar" className="w-9 h-9 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-outfit font-bold text-base shrink-0">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-foreground truncate">{user.username}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-primary" />
                      Profile &amp; Settings
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => { onLogoutRequest(); setProfileOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-grow p-5 lg:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/dashboard" element={<Dashboard setActiveTab={(t) => navigate(`/${t}`)} />} />
            <Route path="/courses"   element={<CoursesPage />} />
            <Route path="/roadmaps"  element={<RoadmapsPage />} />
            <Route path="/timer"     element={<FocusTimerPage />} />
            {/* <Route path="/todos"     element={<TodosPage />} /> */}
            <Route path="/smart-goals" element={<SmartGoalsPage />} />
            <Route path="/study-ide" element={<StudyTasksIDE />} />
            {/* <Route path="/goals"     element={<GoalsPage />} /> */}
            <Route path="/coach"     element={<CoachPage />} />
            <Route path="/notes"     element={<NotesPage />} />
            <Route path="/profile"   element={<ProfilePage />} />
            <Route path="/:subject"  element={<RoadmapsPage />} />
            <Route path="*"          element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { Clover, Lock, User, Mail, AlertCircle, RefreshCw, Target, Eye, EyeOff, Check, X } from 'lucide-react';

export default function Register({ onToggle }) {
  const { register, showToast } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password show/hide states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password rules validation states
  const valFirstCap = password.length > 0 && /^[A-Z]/.test(password);
  const valLength = password.length >= 8;
  const valNumber = /\d/.test(password);
  const valSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(password);
  
  const isPasswordValid = valFirstCap && valLength && valNumber && valSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword) {
      const errMsg = 'Please fill in all fields.';
      setError(errMsg);
      if (showToast) showToast(errMsg, 'error');
      return;
    }

    if (!isPasswordValid) {
      const errMsg = 'Password does not satisfy all validation rules.';
      setError(errMsg);
      if (showToast) showToast(errMsg, 'error');
      return;
    }

    if (password !== confirmPassword) {
      const errMsg = 'Passwords do not match.';
      setError(errMsg);
      if (showToast) showToast(errMsg, 'error');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(username, email, password);
      if (showToast) showToast('Account registered! Planted your clover seed 🍀', 'success');
    } catch (err) {
      const errMsg = err.message || 'Registration failed. Please try a different username or email.';
      setError(errMsg);
      if (showToast) showToast(errMsg, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-card text-card-foreground shadow-md border border-border rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[620px] font-sans">
      
      {/* LEFT COLUMN: HERO PANEL */}
      <div className="hidden md:flex md:w-1/2 bg-muted/65 text-foreground p-10 flex-col justify-between relative overflow-hidden items-center border-r border-border">
        
        {/* Glow Circles */}
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-primary/5 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-primary/5 rounded-full filter blur-3xl animate-pulse"></div>
        
        {/* Clover Graphic */}
        <Clover className="absolute -left-12 -bottom-12 w-48 h-48 text-foreground/5 pointer-events-none rotate-45" />

        {/* Top Header Logo */}
        <div className="flex items-center gap-2.5 relative z-10 w-full self-start">
          <div className="p-2 bg-card border border-border rounded-md">
            <Clover className="w-5 h-5 text-primary animate-float" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-foreground tracking-wide">Code Clover</span>
        </div>

        {/* Floating Showcase cards */}
        <div className="space-y-6 my-8 relative z-10 w-full flex flex-col items-center">
          
          {/* Seed badge card */}
          <div className="bg-card hover:bg-accent border border-border rounded-lg p-5 flex items-center gap-4.5 shadow-sm transition-all duration-300 w-80 select-none">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
              <Clover className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-grow min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-655 dark:text-emerald-400 block mb-0.5">Welcome Reward</span>
              <span className="font-heading text-sm font-bold text-foreground block truncate">Get "Clover Seed" badge!</span>
            </div>
          </div>

          {/* Goal progress card */}
          <div className="bg-card hover:bg-accent border border-border rounded-lg p-5 flex items-center gap-4.5 shadow-sm transition-all duration-300 w-80 select-none">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-md flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-grow min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block mb-0.5">Custom Targets</span>
              <span className="font-heading text-sm font-bold text-foreground block truncate">Track hours per subject</span>
            </div>
          </div>

        </div>

        {/* Hero Footer quote */}
        <div className="relative z-10 w-full self-start">
          <p className="text-xs text-muted-foreground italic leading-relaxed font-semibold">
            "Sow seeds of consistency daily. The focus timer calculates your study index, automatically verifying present status and unlocking badges."
          </p>
        </div>

      </div>

      {/* RIGHT COLUMN: FORM PANEL */}
      <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-card text-card-foreground relative">
        
        {/* Mobile Header Logo */}
        <div className="flex md:hidden items-center justify-center gap-2.5 mb-8">
          <Clover className="w-8 h-8 text-primary animate-float" />
          <span className="font-heading font-extrabold text-2xl text-foreground">Code Clover</span>
        </div>

        <div className="mb-6">
          <h2 className="font-heading font-extrabold text-3xl text-foreground leading-tight">Plant your Clover</h2>
          <p className="text-sm text-muted-foreground mt-1.5 font-semibold">Sign up to build your coding habit and track attendance.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-destructive/10 text-destructive p-3.5 rounded-md text-sm mb-4 border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username"
                className="w-full bg-background border border-input rounded-md py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-background border border-input rounded-md py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={`w-full bg-background border border-input rounded-md py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 transition-all duration-200 ${
                  !showPassword && password ? 'text-base tracking-[3px] font-bold' : ''
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 rounded hover:bg-accent text-muted-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* PASSWORD STRENGTH CHECKLIST DISPLAY */}
            {password && (
              <div className="mt-2.5 bg-muted/50 p-3 rounded-md border border-border space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {valFirstCap ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-muted-foreground/45" />}
                  <span className={valFirstCap ? 'text-primary' : 'text-muted-foreground'}>First letter is capital (A-Z)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {valLength ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-muted-foreground/45" />}
                  <span className={valLength ? 'text-primary' : 'text-muted-foreground'}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {valNumber ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-muted-foreground/45" />}
                  <span className={valNumber ? 'text-primary' : 'text-muted-foreground'}>At least one number (0-9)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {valSpecial ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-muted-foreground/45" />}
                  <span className={valSpecial ? 'text-primary' : 'text-muted-foreground'}>At least one special character (!@#$)</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className={`w-full bg-background border border-input rounded-md py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 transition-all duration-200 ${
                  !showConfirmPassword && confirmPassword ? 'text-base tracking-[3px] font-bold' : ''
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 p-1 rounded hover:bg-accent text-muted-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md py-2.5 font-bold transition-all shadow disabled:opacity-40 disabled:cursor-not-allowed text-sm font-outfit uppercase tracking-wider mt-3"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Sowing seeds...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-border pt-4">
          <p className="text-sm font-semibold text-muted-foreground">
            Already have an account?{' '}
            <button 
              onClick={onToggle}
              className="text-primary font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>

      </div>

    </div>
  );
}

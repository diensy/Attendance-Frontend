import React, { useState, useContext } from 'react';
import { AuthContext, API_URL } from '../App';
import { 
  Clover, Lock, User, AlertCircle, RefreshCw, Award, Flame, Eye, EyeOff,
  HelpCircle, Mail, Key, ShieldCheck, ChevronLeft
} from 'lucide-react';

export default function Login({ onToggle }) {
  const { login, showToast } = useContext(AuthContext);
  
  // Login standard states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMethod, setRecoveryMethod] = useState(''); // 'otp' | 'question' | ''
  const [recoveryStep, setRecoveryStep] = useState(1); // 1 = input email, 2 = input code/answer & reset pass
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      if (showToast) showToast('Signed in successfully! Welcome to Code Clover 🍀', 'success');
    } catch (err) {
      const errMsg = err.message || 'Invalid credentials. Please try again.';
      setError(errMsg);
      if (showToast) showToast(errMsg, 'error');
      setLoading(false);
    }
  };

  // Step 1: Initiate recovery by email
  const handleInitiateRecovery = async (e) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) {
      setRecoveryError('Please enter your registered email address.');
      return;
    }

    setRecoveryError('');
    setRecoveryLoading(true);

    try {
      if (recoveryMethod === 'otp') {
        // Send OTP code via email
        const res = await fetch(`${API_URL}/auth/forgot-password/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: recoveryEmail.trim() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to send recovery OTP.');
        setRecoverySuccess('A 6-digit password recovery code was sent to your email.');
        setRecoveryStep(2);
      } else if (recoveryMethod === 'question') {
        // Retrieve security question from database
        const res = await fetch(`${API_URL}/auth/forgot-password/question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: recoveryEmail.trim() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to find security question.');
        setSecurityQuestion(data.security_question);
        setRecoveryStep(2);
      }
    } catch (err) {
      const errMsg = err.message || 'Something went wrong. Please check your inputs.';
      setRecoveryError(errMsg);
      if (showToast) showToast(errMsg, 'error');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Step 2: Verify answer/code and reset password
  const handleCompleteRecovery = async (e) => {
    e.preventDefault();
    setRecoveryError('');

    if (newPassword.length < 8) {
      setRecoveryError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryError('Passwords do not match.');
      return;
    }

    setRecoveryLoading(true);
    try {
      let res;
      if (recoveryMethod === 'otp') {
        res = await fetch(`${API_URL}/auth/forgot-password/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: recoveryEmail.trim(),
            code: resetCode.trim(),
            new_password: newPassword
          })
        });
      } else {
        res = await fetch(`${API_URL}/auth/forgot-password/verify-question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: recoveryEmail.trim(),
            answer: securityAnswer.trim(),
            new_password: newPassword
          })
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password.');

      const successMsg = 'Password reset successfully! You can now sign in.';
      setRecoverySuccess(successMsg);
      if (showToast) showToast(successMsg, 'success');
      setTimeout(() => {
        setRecoveryMode(false);
        setRecoveryEmail('');
        setRecoveryMethod('');
        setRecoveryStep(1);
        setSecurityQuestion('');
        setSecurityAnswer('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setRecoverySuccess('');
      }, 3500);

    } catch (err) {
      const errMsg = err.message || 'Failed to reset password.';
      setRecoveryError(errMsg);
      if (showToast) showToast(errMsg, 'error');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-card text-card-foreground shadow-md border border-border rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[620px] font-sans">
      
      {/* LEFT COLUMN: HERO PANEL (Visible on md and larger) */}
      <div className="hidden md:flex md:w-1/2 bg-muted/65 text-foreground p-10 flex-col justify-between relative overflow-hidden items-center border-r border-border">
        
        {/* Glow Circles */}
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-primary/5 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-primary/5 rounded-full filter blur-3xl animate-pulse"></div>
        
        {/* Clover Graphic */}
        <Clover className="absolute -left-12 -bottom-12 w-48 h-48 text-foreground/5 pointer-events-none rotate-45" />

        {/* Top Header */}
        <div className="flex items-center gap-2.5 relative z-10 w-full self-start">
          <div className="p-2 bg-card border border-border rounded-md">
            <Clover className="w-5 h-5 text-primary animate-float" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-foreground tracking-wide">Code Clover</span>
        </div>

        {/* Floating Showcase cards */}
        <div className="space-y-6 my-8 relative z-10 w-full flex flex-col items-center">
          
          {/* Milestone Badge card */}
          <div className="bg-card hover:bg-accent border border-border rounded-lg p-5 flex items-center gap-4.5 shadow-sm transition-all duration-300 w-80 select-none">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-grow min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 block mb-0.5">Unlock Badges</span>
              <span className="font-heading text-sm font-bold text-foreground block truncate">Deep Focus unlocked!</span>
            </div>
          </div>

          {/* Streak tracker showcase */}
          <div className="bg-card hover:bg-accent border border-border rounded-lg p-5 flex items-center gap-4.5 shadow-sm transition-all duration-300 w-80 select-none">
            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-md flex items-center justify-center text-orange-500 shrink-0 shadow-sm">
              <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
            </div>
            <div className="flex-grow min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 block mb-0.5">Active Streak</span>
              <span className="font-heading text-sm font-bold text-foreground block truncate">7-Day Study Streak Active</span>
            </div>
          </div>

        </div>

        {/* Hero Footer quote */}
        <div className="relative z-10 w-full self-start">
          <p className="text-xs text-muted-foreground italic leading-relaxed font-semibold">
            "Luck is what happens when preparation meets opportunity. Track your attendance, log study hours, and cultivate consistency."
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

        {/* RECOVERY MODE ROUTER */}
        {recoveryMode ? (
          <div className="space-y-6">
            <button 
              onClick={() => {
                setRecoveryMode(false);
                setRecoveryStep(1);
                setRecoveryMethod('');
                setRecoveryError('');
                setRecoverySuccess('');
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>

            <div>
              <h2 className="font-heading font-extrabold text-3xl text-foreground leading-tight">Recover Password</h2>
              <p className="text-sm text-muted-foreground mt-1.5 font-semibold">Choose a recovery method and unlock your account.</p>
            </div>

            {recoveryError && (
              <div className="flex items-center gap-2.5 bg-destructive/10 text-destructive p-3.5 rounded-md text-xs border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{recoveryError}</span>
              </div>
            )}

            {recoverySuccess && (
              <div className="flex items-center gap-2.5 bg-primary/10 text-primary p-3.5 rounded-md text-xs border border-primary/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="font-bold">{recoverySuccess}</span>
              </div>
            )}

            {/* STEP 1: CHOOSE METHOD & ENTER EMAIL */}
            {recoveryStep === 1 && (
              <form onSubmit={handleInitiateRecovery} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Recovery Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRecoveryMethod('otp')}
                      className={`py-2.5 px-4 rounded-md border text-sm font-bold transition-all text-center ${
                        recoveryMethod === 'otp'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      Email OTP Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoveryMethod('question')}
                      className={`py-2.5 px-4 rounded-md border text-sm font-bold transition-all text-center ${
                        recoveryMethod === 'question'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      Security Question
                    </button>
                  </div>
                </div>

                {recoveryMethod && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="Enter your registered email address"
                        className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={recoveryLoading || !recoveryMethod || !recoveryEmail}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md py-2.5 font-bold transition-all shadow disabled:opacity-50 text-sm font-outfit uppercase tracking-wider"
                >
                  {recoveryLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Initiate Recovery</span>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY CODE/ANSWER & INPUT NEW PASSWORD */}
            {recoveryStep === 2 && (
              <form onSubmit={handleCompleteRecovery} className="space-y-4">
                
                {/* Method conditional fields */}
                {recoveryMethod === 'otp' ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">6-Digit Verification Code</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        maxLength="6"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="Enter 6-digit OTP code"
                        className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Security Question</label>
                    <p className="text-sm font-bold text-foreground italic mb-2">"{securityQuestion}"</p>
                    <div className="relative">
                      <HelpCircle className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        placeholder="Enter your security answer"
                        className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Password reset input boxes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (8+ chars)"
                      className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md py-2.5 font-bold transition-all shadow text-sm font-outfit uppercase tracking-wider"
                >
                  {recoveryLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* STANDARD SIGN IN INTERFACE */
          <>
            <div className="mb-6">
              <h2 className="font-heading font-extrabold text-3xl text-foreground leading-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1.5 font-semibold">Sign in to resume tracking your learning goals.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-destructive/10 text-destructive p-3.5 rounded-md text-sm mb-5 border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Username or Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter username or email"
                    className="w-full bg-background border border-input rounded-md py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                  <button 
                    type="button"
                    onClick={() => {
                      setRecoveryMode(true);
                      setError('');
                    }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md py-2.5 font-bold transition-all shadow disabled:opacity-50 text-sm font-outfit uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Entering Code Clover...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-border pt-5">
              <p className="text-sm font-semibold text-muted-foreground">
                Need to plant your clover?{' '}
                <button 
                  onClick={onToggle}
                  className="text-primary font-bold hover:underline"
                >
                  Sign Up Free
                </button>
              </p>
            </div>
          </>
        )}

      </div>

    </div>
  );
}

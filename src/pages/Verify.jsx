import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../App';
import { ShieldCheck, AlertCircle, RefreshCw, LogOut } from 'lucide-react';

export default function Verify() {
  const { user, verify, resendCode, logout, showToast } = useContext(AuthContext);
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle single key inputs
  const handleChange = (element, index) => {
    const val = element.value.replace(/\D/g, ''); // Enforce numbers only
    if (!val) {
      const nextOtp = [...otp];
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    // Take only the last entered digit
    const digit = val.substring(val.length - 1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    // Auto-focus next input
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspaces
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        // Current cell is already empty, go back and focus previous
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // Support pasting full 6-digit codes
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
    
    if (pastedData.length === 6) {
      const nextOtp = pastedData.split('');
      setOtp(nextOtp);
      inputRefs.current[5].focus(); // Focus last box
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = otp.join('');
    
    if (fullCode.length !== 6) {
      setError('Please fill in all 6 verification digits.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verify(fullCode);
      if (showToast) showToast('Email verified successfully! Welcome to Code Clover 🍀', 'success');
    } catch (err) {
      const errMsg = err.message || 'Invalid or expired verification code.';
      setError(errMsg);
      if (showToast) showToast(errMsg, 'error');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setError('');
    setSuccess('');
    try {
      await resendCode();
      const msg = 'A new 6-digit verification code has been generated!';
      setSuccess(msg);
      if (showToast) showToast(msg, 'success');
      setCooldown(30);
    } catch (err) {
      const errMsg = err.message || 'Failed to resend code.';
      setError(errMsg);
      if (showToast) showToast(errMsg, 'error');
    }
  };

  return (
    <div className="bg-card text-card-foreground shadow border border-border rounded-xl p-8 max-w-sm w-full mx-auto font-sans relative">
      
      <div className="flex flex-col items-center mb-6">
        <div className="p-3 bg-secondary text-primary rounded-full mb-3">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-bold text-2xl tracking-tight text-foreground">Verify Your Email</h2>
        <p className="text-sm text-muted-foreground mt-2 text-center leading-relaxed">
          We sent a 6-digit code to: <br/>
          <strong className="text-foreground">{user.email}</strong>
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive p-3 rounded-md text-xs font-semibold mb-4 border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-primary/10 text-primary p-3 rounded-md text-xs font-semibold mb-4 border border-primary/20">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 6 Digit Input Boxes (Auto-tabbing layout) */}
        <div className="flex justify-between gap-2 max-w-[280px] mx-auto">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              maxLength="1"
              value={digit}
              onChange={e => handleChange(e.target, index)}
              onKeyDown={e => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className="w-10 h-12 bg-background border border-input rounded-md text-center text-lg font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary text-foreground transition-all"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.join('').length !== 6}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md py-2.5 font-semibold text-xs transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider font-outfit"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify Account</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center border-t border-border pt-4 space-y-3">
        <p className="text-xs text-muted-foreground font-semibold">
          Didn't receive the email?{' '}
          <button 
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className={`font-bold ${cooldown > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-primary hover:underline'}`}
          >
            {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}
          </button>
        </p>

        <button 
          onClick={logout}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-destructive hover:underline mx-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out & Go Back</span>
        </button>
      </div>
      
    </div>
  );
}

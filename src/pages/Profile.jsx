import React, { useState, useContext } from 'react';
import { AuthContext, API_URL, formatDate } from '../App';
import { 
  User, Shield, Key, Camera, Loader2, CheckCircle2, AlertCircle, 
  HelpCircle, LogOut, Mail, Calendar
} from 'lucide-react';

export default function Profile() {
  const { token, user, verify, logout, fetchStats, showToast } = useContext(AuthContext);

  // States
  const [profilePic, setProfilePic] = useState(user.profile_pic_url || '');
  const [uploadingPic, setUploadingPic] = useState(false);
  const [picError, setPicError] = useState('');
  const [picSuccess, setPicSuccess] = useState('');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Security question states
  const [question, setQuestion] = useState(user.security_question || 'Who is your favorite teacher?');
  const [answer, setAnswer] = useState('');
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [questionSuccess, setQuestionSuccess] = useState('');

  const questionsList = [
    'Who is your favorite teacher?',
    'What was the name of your first pet?',
    'In what city were you born?',
  ];

  // Upload Profile picture to backend (and Cloudinary)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Enforce 3MB limit
    if (file.size > 3 * 1024 * 1024) {
      setPicError('Image must be under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Data = reader.result;
      setUploadingPic(true);
      setPicError('');
      setPicSuccess('');

      try {
        const res = await fetch(`${API_URL}/auth/profile/picture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64Data })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Image upload failed');

        setProfilePic(data.user.profile_pic_url);
        // Force user context refresh
        user.profile_pic_url = data.user.profile_pic_url;
        const msg = 'Profile picture updated successfully!';
        setPicSuccess(msg);
        if (showToast) showToast(msg, 'success');
      } catch (err) {
        const errMsg = err.message || 'Failed to upload profile picture.';
        setPicError(errMsg);
        if (showToast) showToast(errMsg, 'error');
      } finally {
        setUploadingPic(false);
      }
    };
  };

  // Handle password update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password update failed');

      const msg = 'Password changed successfully!';
      setPassSuccess(msg);
      if (showToast) showToast(msg, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errMsg = err.message || 'Failed to change password.';
      setPassError(errMsg);
      if (showToast) showToast(errMsg, 'error');
    } finally {
      setPassLoading(false);
    }
  };

  // Handle security question setup
  const handleSecurityQuestionSubmit = async (e) => {
    e.preventDefault();
    setQuestionError('');
    setQuestionSuccess('');

    if (!answer.trim()) {
      setQuestionError('Please enter a valid answer.');
      return;
    }

    setQuestionLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile/security-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          security_question: question,
          security_answer: answer
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Setup failed');

      // Update user context
      user.security_question = data.user.security_question;
      const msg = 'Security verification question saved!';
      setQuestionSuccess(msg);
      if (showToast) showToast(msg, 'success');
      setAnswer('');
    } catch (err) {
      const errMsg = err.message || 'Failed to update security question.';
      setQuestionError(errMsg);
      if (showToast) showToast(errMsg, 'error');
    } finally {
      setQuestionLoading(false);
    }
  };

  const getInitials = () => {
    return user.username ? user.username.charAt(0).toUpperCase() : 'C';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      
      {/* HEADER */}
      <div>
        <h2 className="font-outfit font-extrabold text-3xl text-foreground">Profile Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your avatar, configure security credentials, and set up secondary recoveries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT CARD: AVATAR AND META INFO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="clover-card p-6 flex flex-col items-center text-center">
            
            {/* Avatar upload wrapper */}
            <div className="relative group mb-4">
              {profilePic ? (
                <img 
                  src={profilePic} 
                  alt="Profile" 
                  className="w-28 h-28 rounded-full object-cover border-4 border-card shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-outfit font-extrabold text-4xl shadow border-4 border-card">
                  {getInitials()}
                </div>
              )}

              {/* Upload Overlay hover */}
              <label className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200">
                <Camera className="w-6 h-6 text-white" />
                <span className="text-[10px] text-white font-bold mt-1 uppercase tracking-wider">Upload</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>

              {uploadingPic && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <h3 className="font-outfit font-bold text-xl text-foreground">{user.username}</h3>
            <span className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 justify-center">
              <Mail className="w-4 h-4" />
              {user.email}
            </span>

            {picError && (
              <p className="text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 px-3 py-1.5 rounded-md mt-3">{picError}</p>
            )}

            {picSuccess && (
              <p className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md mt-3">{picSuccess}</p>
            )}

            <div className="w-full border-t border-border my-6"></div>

            {/* Quick stats list */}
            <div className="w-full text-left space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold text-muted-foreground">
                <span className="flex items-center gap-2"><Calendar className="w-4.5 h-4.5 text-muted-foreground" /> Joined</span>
                <span className="text-foreground">{formatDate(user.created_at || Date.now())}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-muted-foreground">
                <span className="flex items-center gap-2"><Shield className="w-4.5 h-4.5 text-muted-foreground" /> Account Status</span>
                <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${user.is_verified ? 'bg-primary/15 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                  {user.is_verified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>

            <button 
              onClick={logout}
              className="mt-8 w-full flex items-center justify-center gap-2 border border-destructive/25 bg-destructive/5 hover:bg-destructive/10 text-destructive py-2.5 rounded-md text-xs font-bold transition-all"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Log out Account</span>
            </button>

          </div>
        </div>

        {/* RIGHT COLUMN: CHANGE PASSWORD & SECURITY QUESTIONS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECURITY QUESTION FORM */}
          <div className="clover-card p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="p-2 bg-secondary text-primary rounded-md">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-lg text-foreground">Security Verification Question</h3>
                <p className="text-xs text-muted-foreground">Enable password recovery via security question answers.</p>
              </div>
            </div>

            {user.security_question && (
              <div className="bg-primary/5 border border-primary/20 p-3 rounded-md flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs font-semibold text-primary">Security question is already set. You can update it below.</p>
              </div>
            )}

            {questionError && (
              <div className="flex items-center gap-2.5 bg-destructive/10 text-destructive p-3.5 rounded-md text-sm border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{questionError}</span>
              </div>
            )}

            {questionSuccess && (
              <div className="flex items-center gap-2.5 bg-primary/10 text-primary p-3.5 rounded-md text-sm border border-primary/20">
                <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                <span>{questionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSecurityQuestionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Select Question</label>
                <select
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                >
                  {questionsList.map((q, idx) => (
                    <option key={idx} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Answer Input</label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your security answer here"
                  className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={questionLoading || !answer.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {questionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                <span>Save Question</span>
              </button>
            </form>
          </div>

          {/* CHANGE PASSWORD FORM */}
          <div className="clover-card p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="p-2 bg-secondary text-primary rounded-md">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-lg text-foreground">Change Account Password</h3>
                <p className="text-xs text-muted-foreground">Update your security token to secure your account credentials.</p>
              </div>
            </div>

            {passError && (
              <div className="flex items-center gap-2.5 bg-destructive/10 text-destructive p-3.5 rounded-md text-sm border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="flex items-center gap-2.5 bg-primary/10 text-primary p-3.5 rounded-md text-sm border border-primary/20">
                <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passLoading || !currentPassword || !newPassword || !confirmPassword}
                className="bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                <span>Update Password</span>
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}

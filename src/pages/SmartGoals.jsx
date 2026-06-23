import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API_URL } from '../App';
import Portal from '../components/Portal';
import { Target, Play, Square, X, AlertCircle, BarChart3, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';
import { Select } from '../components/Select';
import { TimePicker } from '../components/TimePicker';
import { Input } from '../components/Input';
import DatePicker from '../components/DatePicker';

export default function SmartGoals() {
  const { token, showToast } = useContext(AuthContext);

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  // Interruption State
  const [interruptedGoal, setInterruptedGoal] = useState(null);
  const [quitReason, setQuitReason] = useState('');

  useEffect(() => {
    fetchGoals();
  }, [token]);

  const fetchGoals = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/smart-goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
        
        // The user now provides the reason via the email buttons. 
        // We no longer automatically pop up the interrupt modal on page refresh.
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !startTime || !endTime || !selectedDate) return;

    // Create Date objects in the user's local timezone
    const [year, month, day] = selectedDate.split('-').map(Number);
    
    const startDate = new Date();
    startDate.setFullYear(year, month - 1, day);
    const [startH, startM] = startTime.split(':');
    startDate.setHours(parseInt(startH), parseInt(startM), 0, 0);

    const endDate = new Date();
    endDate.setFullYear(year, month - 1, day);
    const [endH, endM] = endTime.split(':');
    endDate.setHours(parseInt(endH), parseInt(endM), 0, 0);

    // Handle crossing midnight (e.g. 9 PM to 12 AM)
    if (endTime < startTime) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const startTimestamp = startDate.toISOString();
    const endTimestamp = endDate.toISOString();

    try {
      const res = await fetch(`${API_URL}/smart-goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          reason,
          priority,
          start_time: startTimestamp,
          end_time: endTimestamp
        })
      });
      if (res.ok) {
        showToast('Smart Goal scheduled!', 'success');
        setShowAdd(false);
        setTitle('');
        setReason('');
        setStartTime('');
        setEndTime('');
        setSelectedDate(getTodayDateString());
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
      showToast('Error scheduling goal', 'error');
    }
  };

  // Original handleInterrupt is no longer needed directly.
  // We use setInterruptedGoal to trigger the modal, and submitQuitReason performs the interrupt.

  const handleComplete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/smart-goals/${id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Session completed successfully!', 'success');
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitQuitReason = async () => {
    if (!quitReason || !interruptedGoal) return;
    try {
      const res = await fetch(`${API_URL}/smart-goals/${interruptedGoal.id}/interrupt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quit_reason: quitReason })
      });
      if (res.ok) {
        showToast('Session stopped and reason recorded.', 'info');
        setInterruptedGoal(null);
        setQuitReason('');
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitResumeGoal = async () => {
    if (!interruptedGoal) return;
    try {
      const res = await fetch(`${API_URL}/smart-goals/${interruptedGoal.id}/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Session resumed successfully! Keep up the good work.', 'success');
        setInterruptedGoal(null);
        setQuitReason('');
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Analytics
  const activeCount = goals.filter(g => g.status === 'Active').length;
  const completedCount = goals.filter(g => g.status === 'Completed').length;
  const interruptedCount = goals.filter(g => g.status === 'Interrupted').length;
  const totalFinished = completedCount + interruptedCount;
  const completionRate = totalFinished === 0 ? 0 : Math.round((completedCount / totalFinished) * 100);

  // Quit Reasons Distribution
  const quitReasons = goals.filter(g => g.quit_reason).map(g => g.quit_reason);
  const reasonsCount = quitReasons.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Smart Goal Monitoring System
          </h2>
          <p className="text-sm text-muted-foreground">Track daily study sessions with email reminders and early-quit analytics.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90"
        >
          Schedule Session
        </button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Completion Rate</p>
            <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
          </div>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Interrupted Sessions</p>
            <p className="text-2xl font-bold text-foreground">{interruptedCount}</p>
          </div>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-lg"><Clock className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Sessions</p>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Quit Reasons */}
      {Object.keys(reasonsCount).length > 0 && (
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <h3 className="font-outfit font-bold text-lg mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-muted-foreground" /> Quit Reason Analytics
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(reasonsCount).map(([reason, count]) => (
              <div key={reason} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-md border border-border flex items-center gap-2">
                <span>{reason}</span>
                <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="font-outfit font-bold text-lg text-foreground">Today's Smart Goals</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : goals.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No smart goals scheduled yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {goals.map(goal => (
              <div key={goal.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-foreground text-base">{goal.title}</h4>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      goal.status === 'Active' ? 'bg-blue-500/10 text-blue-500' :
                      goal.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-rose-500/10 text-rose-500'
                    }`}>
                      {goal.status}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      goal.priority === 'High' ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {goal.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{goal.reason}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Planned: {formatDate(goal.start_time)} • {formatTime(goal.start_time)} - {formatTime(goal.end_time)}</span>
                    {goal.actual_end_time && (
                      <span className="flex items-center gap-1.5 text-foreground"><Clock className="w-3.5 h-3.5" /> Ended: {formatTime(goal.actual_end_time)}</span>
                    )}
                  </div>
                </div>

                {goal.status === 'Active' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleComplete(goal.id)}
                      disabled={new Date() < new Date(goal.end_time)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        new Date() < new Date(goal.end_time) 
                        ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed' 
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600'
                      }`}
                      title={new Date() < new Date(goal.end_time) ? 'Cannot complete before scheduled end time' : 'Mark complete'}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Complete
                    </button>
                    <button
                      onClick={() => setInterruptedGoal(goal)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors"
                      title="Quit session early"
                    >
                      <X className="w-4 h-4" /> Quit early
                    </button>
                  </div>
                )}

                {/* Recovery actions for auto-interrupted goals */}
                {goal.status === 'Interrupted' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_URL}/smart-goals/${goal.id}/resume`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          if (res.ok) {
                            showToast('Session restored to Active! ✅', 'success');
                            fetchGoals();
                          }
                        } catch (err) { console.error(err); }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-colors"
                      title="Resume this goal — use if it was falsely marked as interrupted"
                    >
                      <Play className="w-4 h-4" /> Resume
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          // Resume first, then complete
                          await fetch(`${API_URL}/smart-goals/${goal.id}/resume`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                          const res = await fetch(`${API_URL}/smart-goals/${goal.id}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                          if (res.ok) {
                            showToast('Session marked as Completed! 🎉', 'success');
                            fetchGoals();
                          }
                        } catch (err) { console.error(err); }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors"
                      title="Mark as completed — use if you finished the session but it was incorrectly interrupted"
                    >
                      <CheckCircle2 className="w-4 h-4" /> I Finished It
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showAdd && (
        <Portal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-card text-card-foreground border border-border rounded-xl p-6 max-w-md w-full shadow-lg">
              <h3 className="font-outfit font-bold text-lg mb-4">Schedule Smart Goal</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Goal Name</label>
                  <Input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Python OOP" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 font-outfit">Select Date</label>
                  <DatePicker required value={selectedDate} onChange={val => setSelectedDate(val)} minDate="today" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Why are you doing this? (Reason)</label>
                  <Input required type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Learn AI and Data Science" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Start Time</label>
                    <TimePicker required value={startTime} onChange={val => setStartTime(val)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">End Time</label>
                    <TimePicker required value={endTime} onChange={val => setEndTime(val)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Priority</label>
                  <Select
                    value={priority}
                    onChange={(val) => setPriority(val)}
                    options={[
                      { label: "High", value: "High" },
                      { label: "Medium", value: "Medium" },
                      { label: "Low", value: "Low" }
                    ]}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 text-xs font-semibold bg-secondary text-secondary-foreground border border-input rounded-md hover:bg-muted">Cancel</button>
                  <button type="submit" className="flex-1 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Schedule Goal</button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Interruption Reason Modal */}
      {interruptedGoal && (
        <Portal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-card text-card-foreground border border-border rounded-2xl p-0 max-w-md w-full shadow-2xl overflow-hidden relative">
              
              {/* Header with subtle gradient */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none" />
              
              <div className="p-8 relative">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <AlertCircle className="w-8 h-8" />
                </div>
                
                <h3 className="font-outfit font-extrabold text-center text-2xl mb-2 text-foreground tracking-tight">Session Interrupted</h3>
                <p className="text-center text-sm text-muted-foreground mb-6">We noticed your study session ended early. Did something come up, or are you still here?</p>
                
                {/* Session Details Box */}
                <div className="bg-muted/50 rounded-xl p-4 mb-6 border border-border/50 text-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Goal</span>
                    <span className="font-bold text-foreground">{interruptedGoal.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Planned Time</span>
                    <span className="font-medium text-foreground">{formatTime(interruptedGoal.start_time)} - {formatTime(interruptedGoal.end_time)}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-500">
                    <span className="font-semibold">Actual Stop</span>
                    <span className="font-bold">{formatTime(interruptedGoal.actual_end_time)}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border"></div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select a Reason</p>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {['Office Work', 'Family Work', 'Tired', 'Emergency', 'Lost Focus', 'Other'].map(r => (
                      <button
                        key={r}
                        onClick={() => setQuitReason(r)}
                        className={`p-3 text-sm font-semibold rounded-xl border-2 transition-all duration-200 ${
                          quitReason === r 
                            ? 'bg-rose-500/10 border-rose-500 text-rose-600 shadow-sm' 
                            : 'bg-card border-border text-muted-foreground hover:border-muted hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={submitResumeGoal}
                    className="flex-1 py-3 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    I'm still here!
                  </button>
                  <button 
                    onClick={submitQuitReason}
                    disabled={!quitReason}
                    className="flex-1 py-3 bg-secondary text-secondary-foreground text-sm font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors border border-border"
                  >
                    Save & Quit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}

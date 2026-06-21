import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext, API_URL } from '../App';
import Portal from './Portal';
import { 
  Play, Pause, RotateCcw, Award, CheckCircle2, AlertCircle, Sparkles,
  Volume2, VolumeX, Bell, BellOff, Hourglass, Zap, Clover
} from 'lucide-react';

export default function FocusTimer() {
  const { token, fetchStats, showToast } = useContext(AuthContext);

  // Sound and Browser Notification toggle states
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifyEnabled, setNotifyEnabled] = useState(false);

  // Timer modes: 'pomodoro' | 'long' | 'custom' | 'stopwatch'
  const [mode, setMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState(0);

  // Stopwatch state
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  // Logging modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [completedDuration, setCompletedDuration] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef(null);
  const totalDurationRef = useRef(0); // tracks total active seconds studied in current session

  // Request browser notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotifyEnabled(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotifyEnabled(permission === 'granted');
  };

  // Sound Synthesizer using Web Audio API (cross-platform, zero asset load files required)
  const playBuzzerSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Frequency sequence creating a cute "Ding-Dong" bell
      const playTone = (freq, start, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        
        osc.start(start);
        osc.stop(start + duration);
      };
      
      playTone(523.25, 0, 0.4); // C5 tone
      playTone(659.25, 0.25, 0.6); // E5 tone
    } catch (e) {
      console.warn('Web Audio playback blocked or unsupported:', e);
    }
  };

  // Push browser desktop notification
  const triggerNotification = (title, body) => {
    if (notifyEnabled && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍀</text></svg>'
      });
    }
  };

  // Timer Tick handler
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (mode === 'stopwatch') {
          setStopwatchSeconds(prev => {
            const next = prev + 1;
            totalDurationRef.current += 1;
            return next;
          });
        } else {
          setTimeLeft(prev => {
            if (prev <= 1) {
              // Timer Finished!
              handleSessionComplete();
              return 0;
            }
            totalDurationRef.current += 1;
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    playBuzzerSound();
    triggerNotification('🍀 Session Completed!', 'Fantastic job! Select your topics to update your Clover attendance.');
    
    // Set completed time
    const duration = mode === 'stopwatch' ? stopwatchSeconds : (getModeDuration() - timeLeft);
    setCompletedDuration(duration || totalDurationRef.current);
    setShowLogModal(true);
  };

  const getModeDuration = () => {
    if (mode === 'pomodoro') return 25 * 60;
    if (mode === 'long') return 50 * 60;
    if (mode === 'custom') return customMinutes * 60;
    return 0;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'stopwatch') {
      setStopwatchSeconds(0);
    } else {
      setTimeLeft(getModeDuration());
    }
    totalDurationRef.current = 0;
  };

  const handleModeChange = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    totalDurationRef.current = 0;
    
    if (newMode === 'pomodoro') setTimeLeft(25 * 60);
    else if (newMode === 'long') setTimeLeft(50 * 60);
    else if (newMode === 'custom') setTimeLeft(customMinutes * 60);
    else setStopwatchSeconds(0);
  };

  const handleCustomMinutesChange = (e) => {
    const mins = Math.max(1, Math.min(180, parseInt(e.target.value) || 0));
    setCustomMinutes(mins);
    if (mode === 'custom') {
      setIsRunning(false);
      setTimeLeft(mins * 60);
    }
  };

  // Select Topics learned list
  const toggleTopicSelection = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  // Submit focus session log
  const handleSaveSessionLog = async (e) => {
    e.preventDefault();
    if (completedDuration < 5 && mode === 'stopwatch') {
      showToast?.('Please study for at least 5 seconds to log a session.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/timer/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: mode === 'stopwatch' ? 'Stopwatch' : 'Pomodoro',
          mode: mode === 'pomodoro' ? '25/5' : (mode === 'long' ? '50/10' : (mode === 'custom' ? `${customMinutes}m` : 'Stopwatch')),
          duration_seconds: completedDuration,
          topics: selectedTopics,
          notes: notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save session');

      setSuccessMessage('🍀 Study session logged and Attendance updated!');
      showToast?.('Study session logged and Attendance updated! 🍀', 'success');
      setUnlockedBadges(data.badgesUnlocked || []);
      
      // Update global user stats
      await fetchStats();

      // Reset
      setTimeout(() => {
        setShowLogModal(false);
        setSuccessMessage('');
        setUnlockedBadges([]);
        setSelectedTopics([]);
        setNotes('');
        handleReset();
        setLoading(false);
      }, 2500);

    } catch (err) {
      console.error(err);
      showToast?.('Error saving session log: ' + err.message, 'error');
      setLoading(false);
    }
  };

  // Formatting utility
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPercentageLeft = () => {
    if (mode === 'stopwatch') return 100;
    const total = getModeDuration();
    if (total === 0) return 0;
    return (timeLeft / total) * 100;
  };

  const subjectsOptions = ['Node.js', 'Python', 'DSA', 'AI/Data Science'];

  return (
    <div className="space-y-8">
      {/* HEADER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-foreground">Focus Timer</h2>
          <p className="text-sm text-muted-foreground">Lock in your coding time. Accumulating hours automatically triggers daily attendance.</p>
        </div>

        {/* Alert preferences */}
        <div className="flex items-center gap-2">
          {/* Notification Alert toggle */}
          <button
            onClick={notifyEnabled ? () => setNotifyEnabled(false) : requestNotificationPermission}
            className={`p-2 px-3.5 rounded-md border text-xs font-semibold transition-all flex items-center gap-2 ${
              notifyEnabled
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            title="Toggle Desktop Notifications"
          >
            {notifyEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            <span className="hidden sm:inline">Desktop Notifications</span>
          </button>

          {/* Sound Alert toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 px-3.5 rounded-md border text-xs font-semibold transition-all flex items-center gap-2 ${
              soundEnabled
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            title="Toggle Alarm Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">Buzzer Alert</span>
          </button>
        </div>
      </div>

      {/* TIMER CARD CARD */}
      <div className="max-w-xl mx-auto bg-card text-card-foreground shadow border border-border rounded-xl p-8 flex flex-col items-center relative overflow-hidden">
        
        {/* Decorative background leaf */}
        <Clover className="absolute -right-16 -top-16 w-48 h-48 text-muted-foreground/5 pointer-events-none rotate-45" />

        {/* TIMER MODE SELECTOR */}
        <div className="flex bg-secondary p-1 rounded-md gap-1 mb-10 w-full max-w-sm relative z-10 border border-border">
          {[
            { id: 'pomodoro', label: '25m Pomodoro' },
            { id: 'long', label: '50m Focus' },
            { id: 'custom', label: 'Custom' },
            { id: 'stopwatch', label: 'Stopwatch' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleModeChange(opt.id)}
              className={`flex-1 text-center py-1.5 rounded-sm font-outfit font-semibold text-xs transition-all ${
                mode === opt.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* CUSTOM TIME CONTROLLERS */}
        {mode === 'custom' && (
          <div className="flex items-center gap-3 mb-8 bg-muted/40 p-2.5 rounded-md border border-border relative z-10">
            <span className="text-xs font-semibold text-muted-foreground">Duration Minutes:</span>
            <input
              type="number"
              value={customMinutes}
              onChange={handleCustomMinutesChange}
              min="1"
              max="180"
              className="w-16 text-center bg-background border border-input rounded-md py-1 px-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            />
          </div>
        )}

        {/* TIMER DIAL VISUALIZATION */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
          
          {/* Radial progress circle */}
          <svg className="absolute w-full h-full -rotate-90">
            <circle 
              cx="128" 
              cy="128" 
              r="114" 
              className="stroke-muted fill-none stroke-[6]"
            />
            <circle 
              cx="128" 
              cy="128" 
              r="114" 
              className="stroke-primary fill-none stroke-[6] transition-all duration-300"
              strokeDasharray={716.3}
              strokeDashoffset={716.3 - (716.3 * getPercentageLeft()) / 100}
              strokeLinecap="round"
            />
          </svg>

          {/* Time digits text */}
          <div className="text-center flex flex-col items-center select-none z-10">
            <Hourglass className={`w-6 h-6 text-primary/45 mb-1 ${isRunning ? 'animate-bounce' : ''}`} />
            <span className="font-outfit font-extrabold text-5xl tracking-tight text-foreground animate-float">
              {mode === 'stopwatch' ? formatTime(stopwatchSeconds) : formatTime(timeLeft)}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">
              {isRunning ? 'Ticking Session' : 'Timer Paused'}
            </span>
          </div>
        </div>

        {/* CONTROLS SWITCH */}
        <div className="flex items-center gap-4 relative z-10">
          {/* Reset button */}
          <button
            onClick={handleReset}
            className="p-3 rounded-full bg-secondary border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:-rotate-45 transition-all"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Start/Stop Button */}
          <button
            onClick={handleStartPause}
            className={`px-8 py-3 rounded-full font-outfit font-bold text-xs tracking-wider uppercase text-white shadow transition-all hover:scale-[1.01] active:scale-[0.99] ${
              isRunning
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/20'
            }`}
          >
            {isRunning ? 'Pause Session' : 'Start Focus'}
          </button>

          {/* Stop / Finish button (Stopwatch or active progress) */}
          <button
            onClick={handleSessionComplete}
            disabled={(!isRunning && timeLeft === getModeDuration() && mode !== 'stopwatch') || (mode === 'stopwatch' && stopwatchSeconds === 0)}
            className="p-3 rounded-full bg-secondary border border-border text-primary hover:bg-primary/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Finish and log session"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SESSION LOG DATA MODAL */}
      {showLogModal && (
        <Portal>
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 max-w-md w-full shadow-lg relative animate-float overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <div className="p-2 bg-secondary text-primary rounded-md">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-lg text-foreground">Save Study Session</h3>
                <p className="text-xs text-muted-foreground">Add notes and subjects to claim daily attendance.</p>
              </div>
            </div>

            {successMessage ? (
              <div className="space-y-4 py-6 text-center">
                <div className="w-12 h-12 bg-primary/15 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Sparkles className="w-6 h-6 animate-spin" />
                </div>
                <h4 className="font-outfit font-semibold text-lg text-primary">{successMessage}</h4>
                
                {/* Badges notification */}
                {unlockedBadges.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md max-w-sm mx-auto flex items-center gap-3">
                    <Award className="w-8 h-8 text-amber-550 fill-amber-100/10 shrink-0" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-amber-600">Badge Unlocked: {unlockedBadges[0].name}</p>
                      <p className="text-[10px] text-muted-foreground">{unlockedBadges[0].desc}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveSessionLog} className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Focused Time Completed:</p>
                  <span className="font-outfit font-bold text-xl text-foreground">
                    {Math.round(completedDuration / 60)} minutes ({completedDuration} seconds)
                  </span>
                </div>

                {/* Topics selection checklists */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">What did you learn during this session?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {subjectsOptions.map(sub => {
                      const isSelected = selectedTopics.includes(sub);
                      return (
                        <button
                          type="button"
                          key={sub}
                          onClick={() => toggleTopicSelection(sub)}
                          className={`py-2 px-3 rounded-md border text-xs font-semibold text-left transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Add Short Notes (Topics covered, errors solved, etc.)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Completed express controllers logic and mapped pg pool query routers. Solved EPERM path errors in windows sandbox."
                    rows="3"
                    className="w-full bg-background border border-input rounded-md p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                  ></textarea>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="flex-1 py-2 text-xs font-semibold bg-secondary text-secondary-foreground border border-input rounded-md hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-55"
                  >
                    {loading ? 'Logging...' : 'Log & Complete'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
        </Portal>
      )}

    </div>
  );
}

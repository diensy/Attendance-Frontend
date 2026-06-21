import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API_URL, formatDate } from '../App';
import DatePicker from '../components/DatePicker';
import Portal from '../components/Portal';
import { 
  Target, Calendar, CheckCircle2, Plus, Trash2, Award, Clock, 
  Sparkles, Check, Play, RefreshCw, X, AlertCircle 
} from 'lucide-react';
import { Select } from '../components/Select';
import { Input } from '../components/Input';

export default function Goals() {
  const { token, fetchStats, showToast } = useContext(AuthContext);

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Node.js');
  const [targetHours, setTargetHours] = useState(10);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  // Badge notification state
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchGoals = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [token]);

  // Create Goal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !category || !targetHours || !targetDate) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    try {
      const res = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          category,
          target_hours: Number(targetHours),
          target_date: targetDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create goal');

      setShowAddGoal(false);
      setTitle('');
      setTargetHours(10);
      setTargetDate(new Date().toISOString().split('T')[0]);
      setError('');
      await fetchGoals();
    } catch (err) {
      setError(err.message);
    }
  };

  // Adjust current hours logged
  const handleUpdateHours = async (id, currentVal, change) => {
    const newVal = Math.max(0, Number(currentVal) + change);
    try {
      const res = await fetch(`${API_URL}/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ current_hours: newVal })
      });

      const data = await res.json();
      if (data.badgeUnlocked) {
        setUnlockedBadge(data.badgeUnlocked);
        await fetchStats();
      }

      await fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle goal completion state manually
  const handleToggleCompleted = async (id, isCompleted) => {
    try {
      const res = await fetch(`${API_URL}/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_completed: !isCompleted })
      });

      const data = await res.json();
      if (data.badgeUnlocked) {
        setUnlockedBadge(data.badgeUnlocked);
        await fetchStats();
      }

      await fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Goal
  const handleDelete = async (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      const res = await fetch(`${API_URL}/goals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Study goal deleted.', 'info');
        await fetchGoals();
      } else {
        showToast('Failed to delete goal.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error. Please try again.', 'error');
    }
  };

  const categories = ['Node.js', 'Python', 'DSA', 'AI/Data Science', 'GitHub', 'General'];

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  // ── Compute Roadmap Progresses ──
  const calculateRoadmapProgress = (cats) => {
    const matched = goals.filter(g => cats.includes(g.category));
    if (matched.length === 0) return { percent: 0, hasGoals: false, current: 0, target: 0 };
    const current = matched.reduce((acc, g) => acc + Number(g.current_hours), 0);
    const target = matched.reduce((acc, g) => acc + Number(g.target_hours), 0);
    return {
      percent: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
      hasGoals: true,
      current: Number(current.toFixed(1)),
      target: Number(target.toFixed(1))
    };
  };

  const nodeProgress = calculateRoadmapProgress(['Node.js', 'GitHub']);
  const pythonProgress = calculateRoadmapProgress(['Python', 'AI/Data Science']);
  const dsaProgress = calculateRoadmapProgress(['DSA']);

  return (
    <div className="space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-foreground">Learning Goals</h2>
          <p className="text-sm text-muted-foreground">Establish study metrics and log hours. Focus sessions automatically advance category targets.</p>
        </div>

        <button
          onClick={() => {
            setError('');
            setTitle('');
            setTargetHours(10);
            setTargetDate(new Date().toISOString().split('T')[0]);
            setShowAddGoal(true);
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2 rounded-md text-xs font-bold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Study Goal</span>
        </button>
      </div>

      {/* BADGE UNLOCKED MODAL */}
      {unlockedBadge && (
        <Portal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm">
            <div className="bg-card text-card-foreground border border-border rounded-xl p-8 max-w-sm w-full text-center shadow-lg relative overflow-hidden animate-float">
              <Award className="w-14 h-14 text-amber-500 fill-amber-100/10 mx-auto mb-4 animate-bounce" />
              <h3 className="font-outfit font-extrabold text-xl text-amber-500">Badge Unlocked!</h3>
              <p className="font-bold text-sm text-foreground mt-2">"{unlockedBadge.name}"</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-normal">{unlockedBadge.desc}</p>
              <button
                onClick={() => setUnlockedBadge(null)}
                className="mt-6 w-full py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-xs font-bold shadow-sm"
              >
                Excellent!
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* LOADING INDICATOR */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* ACTIVE GOALS PANEL */}
          <div className="space-y-4">
            <h3 className="font-outfit font-bold text-base text-foreground">Active Milestone Targets ({activeGoals.length})</h3>
            
            {activeGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeGoals.map(goal => {
                  const percentage = Math.min(100, Math.round((Number(goal.current_hours) / Number(goal.target_hours)) * 100));
                  return (
                    <div key={goal.id} className="clover-card p-6 flex flex-col justify-between">
                      
                      {/* Title & category */}
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                            {goal.category}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                            <Calendar className="w-3 h-3" />
                            {formatDate(goal.target_date)}
                          </span>
                        </div>
                        <h4 className="font-outfit font-bold text-sm text-foreground line-clamp-1">{goal.title}</h4>
                      </div>

                      {/* Progress Metrics */}
                      <div className="my-6">
                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1.5">
                          <span>Progress: {percentage}%</span>
                          <span>{Number(goal.current_hours)} / {Number(goal.target_hours)} hrs</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5 relative overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Interactive controllers */}
                      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                        <div className="flex items-center gap-1.5">
                          {/* Hour adjustment clickers */}
                          <button
                            onClick={() => handleUpdateHours(goal.id, goal.current_hours, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-input text-muted-foreground bg-background hover:bg-accent hover:text-accent-foreground text-xs font-bold"
                            title="Subtract 1 hour"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleUpdateHours(goal.id, goal.current_hours, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-input text-muted-foreground bg-background hover:bg-accent hover:text-accent-foreground text-xs font-bold"
                            title="Add 1 hour"
                          >
                            +1
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="p-1.5 rounded-md border border-input text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
                            title="Delete goal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Complete toggle */}
                          <button
                            onClick={() => handleToggleCompleted(goal.id, goal.is_completed)}
                            className="p-1.5 rounded-md border border-input text-primary hover:bg-primary/10 transition-all flex items-center justify-center"
                            title="Mark Completed"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-card text-card-foreground rounded-xl border border-border shadow-sm">
                <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <h4 className="font-outfit font-bold text-sm text-foreground">No active goals</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 mb-5">
                  Break down your subjects into manageable milestone targets.
                </p>
                <button
                  onClick={() => {
                    setError('');
                    setTitle('');
                    setTargetHours(10);
                    setTargetDate(new Date().toISOString().split('T')[0]);
                    setShowAddGoal(true);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2 rounded-md text-xs font-semibold shadow-sm"
                >
                  Create Your First Goal
                </button>
              </div>
            )}
          </div>

          {/* LEARNING ROADMAPS SECTION */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <div>
              <h3 className="font-outfit font-bold text-base text-foreground">Learning Roadmaps</h3>
              <p className="text-xs text-muted-foreground">Compounded pathway tracker mapped automatically from your target goal hours.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Roadmap 1: Node.js Backend */}
              <div className="clover-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Node.js &amp; Git
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">{nodeProgress.percent}% Done</span>
                  </div>
                  <h4 className="font-outfit font-bold text-sm text-foreground">Node.js Backend Developer</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 mb-4">Master backend servers, database CRUD APIs, and server integrations.</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-secondary rounded-full h-1.5 mb-5 relative overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${nodeProgress.percent}%` }}
                    ></div>
                  </div>

                  {/* Milestones list */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        nodeProgress.percent >= 33 ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background text-muted-foreground/30'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className={nodeProgress.percent >= 33 ? 'text-foreground' : 'text-muted-foreground'}>
                        Milestone 1: Express Server &amp; Routing
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        nodeProgress.percent >= 66 ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background text-muted-foreground/30'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className={nodeProgress.percent >= 66 ? 'text-foreground' : 'text-muted-foreground'}>
                        Milestone 2: Postgres Database Schema &amp; CRUD
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        nodeProgress.percent >= 100 ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background text-muted-foreground/30'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className={nodeProgress.percent >= 100 ? 'text-foreground' : 'text-muted-foreground'}>
                        Milestone 3: JWT Authentication &amp; Middlewares
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border text-[10px] text-muted-foreground font-semibold">
                  {nodeProgress.hasGoals ? (
                    <span>Mapped to: {nodeProgress.current} / {nodeProgress.target} total goal hours</span>
                  ) : (
                    <span className="text-amber-500">💡 Set a Node.js goal to begin this roadmap.</span>
                  )}
                </div>
              </div>

              {/* Roadmap 2: Python & AI */}
              <div className="clover-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-500 border border-sky-500/20 px-2 py-0.5 rounded">
                      Python &amp; AI
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">{pythonProgress.percent}% Done</span>
                  </div>
                  <h4 className="font-outfit font-bold text-sm text-foreground">Python &amp; AI Data Scientist</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 mb-4">Build predictive ML systems, learn object oriented scripts, and clean datasets.</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-secondary rounded-full h-1.5 mb-5 relative overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${pythonProgress.percent}%` }}
                    ></div>
                  </div>

                  {/* Milestones list */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        pythonProgress.percent >= 33 ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background text-muted-foreground/30'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className={pythonProgress.percent >= 33 ? 'text-foreground' : 'text-muted-foreground'}>
                        Milestone 1: Python OOP &amp; Foundations
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        pythonProgress.percent >= 66 ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background text-muted-foreground/30'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className={pythonProgress.percent >= 66 ? 'text-foreground' : 'text-muted-foreground'}>
                        Milestone 2: Pandas Data Cleanup &amp; Stats
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        pythonProgress.percent >= 100 ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background text-muted-foreground/30'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className={pythonProgress.percent >= 100 ? 'text-foreground' : 'text-muted-foreground'}>
                        Milestone 3: Build &amp; Train ML Classifier Models
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border text-[10px] text-muted-foreground font-semibold">
                  {pythonProgress.hasGoals ? (
                    <span>Mapped to: {pythonProgress.current} / {pythonProgress.target} total goal hours</span>
                  ) : (
                    <span className="text-amber-500">💡 Set a Python or AI goal to begin this roadmap.</span>
                  )}
                </div>
              </div>

              {/* Roadmap 3: DSA Master */}
              <div className="clover-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-0.5 rounded">
                      DSA
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">{dsaProgress.percent}% Done</span>
                  </div>
                  <h4 className="font-outfit font-bold text-sm text-foreground">DSA &amp; Problem Solving Master</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 mb-4">Learn core computational limits, optimize search sorting, and design tree structures.</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-secondary rounded-full h-1.5 mb-5 relative overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${dsaProgress.percent}%` }}
                    ></div>
                  </div>

                  {/* Milestones list */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        dsaProgress.percent >= 33 ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background text-muted-foreground/30'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className={dsaProgress.percent >= 33 ? 'text-foreground' : 'text-muted-foreground'}>
                        Milestone 1: Big O Complexity &amp; Arrays
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        dsaProgress.percent >= 66 ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background text-muted-foreground/30'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className={dsaProgress.percent >= 66 ? 'text-foreground' : 'text-muted-foreground'}>
                        Milestone 2: Trees, Heaps &amp; Hash Maps
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        dsaProgress.percent >= 100 ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background text-muted-foreground/30'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className={dsaProgress.percent >= 100 ? 'text-foreground' : 'text-muted-foreground'}>
                        Milestone 3: Dynamic Programming &amp; Graphs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border text-[10px] text-muted-foreground font-semibold">
                  {dsaProgress.hasGoals ? (
                    <span>Mapped to: {dsaProgress.current} / {dsaProgress.target} total goal hours</span>
                  ) : (
                    <span className="text-amber-500">💡 Set a DSA goal to begin this roadmap.</span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* COMPLETED GOALS PANEL */}
          {completedGoals.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-outfit font-bold text-base text-foreground">Archived Milestones ({completedGoals.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedGoals.map(goal => (
                  <div key={goal.id} className="rounded-xl border border-border bg-muted/30 p-6 flex flex-col justify-between opacity-70">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded-sm">
                          {goal.category}
                        </span>
                        <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                      </div>
                      <h4 className="font-outfit font-semibold text-xs text-muted-foreground line-through truncate">{goal.title}</h4>
                      <p className="text-[10px] text-muted-foreground mt-2">Goal of {Number(goal.target_hours)} hrs reached!</p>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleCompleted(goal.id, goal.is_completed)}
                        className="px-2.5 py-1 rounded border border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground text-[10px] font-semibold"
                      >
                        Re-active
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* CREATE GOAL MODAL BOX */}
      {showAddGoal && (
        <Portal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-card text-card-foreground border border-border rounded-xl p-6 max-w-md w-full shadow-lg relative animate-float">
              
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
                <div className="p-2 bg-secondary text-primary rounded-md">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-lg text-foreground">Create Study Target</h3>
                  <p className="text-xs text-muted-foreground">Setup specific subjects targets and complete logs.</p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 bg-destructive/10 text-destructive p-3.5 rounded-md text-xs mb-5 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Goal Description Title</label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Master Node.js Event Loop & Stream pipelines"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Subject Category</label>
                    <Select
                      value={category}
                      onChange={(val) => setCategory(val)}
                      options={categories.map(cat => ({ label: cat, value: cat }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Target Study Hours</label>
                    <Input
                      type="number"
                      value={targetHours}
                      onChange={(e) => setTargetHours(Math.max(1, parseInt(e.target.value) || 0))}
                      min="1"
                      max="1000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Target Finish Date</label>
                  <DatePicker
                    value={targetDate}
                    onChange={(v) => setTargetDate(v)}
                    placeholder="Pick target date"
                    minDate="today"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddGoal(false)}
                    className="flex-1 py-2 text-xs font-semibold bg-secondary text-secondary-foreground border border-input rounded-md hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Create Target
                  </button>
                </div>
              </form>

            </div>
          </div>
        </Portal>
      )}

      {/* ── DELETE CONFIRM SNACKBAR DIALOG ── */}
      {deleteConfirmId && (
        <Portal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-base text-foreground">Delete Goal?</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2 text-xs font-semibold bg-secondary text-secondary-foreground border border-input rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2 text-xs font-bold bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors shadow-sm uppercase tracking-wider"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}

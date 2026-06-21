import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext, API_URL } from '../App';
import Portal from '../components/Portal';
import { 
  GitFork, CheckCircle, Award, BookOpen, Trash2, Plus, X, ArrowLeft, Youtube, ChevronRight
} from 'lucide-react';

export default function Roadmaps() {
  const { token, showToast } = useContext(AuthContext);
  const { subject } = useParams();
  const navigate = useNavigate();
  
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Roadmap creation states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoadmapTitle, setNewRoadmapTitle] = useState('');
  const [newRoadmapSubject, setNewRoadmapSubject] = useState('General');
  const [isSavingRoadmap, setIsSavingRoadmap] = useState(false);

  // AI Generator states
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSubject, setAiSubject] = useState('General');
  const [isGenerating, setIsGenerating] = useState(false);

  // Roadmap item inputs state mapping: { [roadmapId]: 'item title text' }
  const [itemInputs, setItemInputs] = useState({});

  const fetchRoadmaps = async () => {
    try {
      const res = await fetch(`${API_URL}/courses/roadmaps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRoadmaps(await res.json());
      }
    } catch (e) {
      console.error(e);
      showToast('Error loading roadmaps', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const handleCreateRoadmap = async (e) => {
    e.preventDefault();
    if (!newRoadmapTitle.trim()) return;

    setIsSavingRoadmap(true);
    try {
      const res = await fetch(`${API_URL}/courses/roadmaps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: newRoadmapTitle.trim(),
          subject: newRoadmapSubject
        })
      });
      if (res.ok) {
        showToast('Learning roadmap created! 🗺️', 'success');
        setNewRoadmapTitle('');
        setNewRoadmapSubject('General');
        setShowCreateForm(false);
        fetchRoadmaps();
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to create roadmap', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'error');
    } finally {
      setIsSavingRoadmap(false);
    }
  };

  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/courses/roadmaps/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          prompt: aiPrompt.trim(),
          subject: aiSubject
        })
      });
      if (res.ok) {
        showToast('AI Roadmap generated successfully! 🤖', 'success');
        setAiPrompt('');
        setAiSubject('General');
        setShowAiForm(false);
        fetchRoadmaps();
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to generate roadmap', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to AI service', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteRoadmap = async (roadmapId) => {
    if (!window.Swal) {
      if (!window.confirm('Delete this roadmap?')) return;
    }

    window.Swal.fire({
      title: 'Delete Roadmap Track?',
      text: 'This will remove the entire roadmap and all its milestone steps.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#EF4444',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_URL}/courses/roadmaps/${roadmapId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            showToast('Learning roadmap track deleted! 🗑️', 'success');
            fetchRoadmaps();
          } else {
            showToast('Failed to delete roadmap', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Error deleting roadmap', 'error');
        }
      }
    });
  };

  const handleAddItem = async (roadmapId) => {
    const title = itemInputs[roadmapId] || '';
    if (!title.trim()) return;

    try {
      const res = await fetch(`${API_URL}/courses/roadmaps/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roadmapId,
          title: title.trim()
        })
      });

      if (res.ok) {
        // Clear input
        setItemInputs(prev => ({ ...prev, [roadmapId]: '' }));
        fetchRoadmaps();
      } else {
        showToast('Failed to add step', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const res = await fetch(`${API_URL}/courses/roadmaps/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRoadmaps();
      } else {
        showToast('Failed to delete milestone step', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleItemStatus = async (itemId) => {
    try {
      const res = await fetch(`${API_URL}/courses/roadmaps/items/${itemId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRoadmaps();
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error', 'error');
    }
  };

  const handleInputChange = (roadmapId, val) => {
    setItemInputs(prev => ({ ...prev, [roadmapId]: val }));
  };

  const getNormalizedSubject = (routeSubject) => {
    if (!routeSubject) return null;
    const lower = routeSubject.toLowerCase();
    if (lower === 'node.js') return 'Node.js';
    if (lower === 'react') return 'React';
    if (lower === 'python') return 'Python';
    if (lower === 'dsa') return 'DSA';
    if (lower === 'ai/data science' || lower === 'ai' || lower === 'datascience') return 'AI/Data Science';
    if (lower === 'general') return 'General';
    return routeSubject.charAt(0).toUpperCase() + routeSubject.slice(1);
  };

  const getSubjectStyles = (sub) => {
    switch (sub) {
      case 'Node.js':
        return {
          bg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40',
          iconBg: 'bg-emerald-500/10 text-emerald-500',
          text: 'text-emerald-500',
          progress: 'bg-emerald-500',
          gradient: 'from-emerald-500/20 to-teal-500/5'
        };
      case 'React':
        return {
          bg: 'bg-sky-500/5 hover:bg-sky-500/10 border-sky-500/20 hover:border-sky-500/40',
          iconBg: 'bg-sky-500/10 text-sky-500',
          text: 'text-sky-500',
          progress: 'bg-sky-500',
          gradient: 'from-sky-500/20 to-blue-500/5'
        };
      case 'Python':
        return {
          bg: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40',
          iconBg: 'bg-blue-500/10 text-yellow-500',
          text: 'text-blue-500',
          progress: 'bg-yellow-500',
          gradient: 'from-blue-500/20 to-yellow-500/5'
        };
      case 'DSA':
        return {
          bg: 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40',
          iconBg: 'bg-rose-500/10 text-rose-500',
          text: 'text-rose-500',
          progress: 'bg-rose-500',
          gradient: 'from-rose-500/20 to-orange-500/5'
        };
      case 'AI/Data Science':
        return {
          bg: 'bg-violet-500/5 hover:bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40',
          iconBg: 'bg-violet-500/10 text-violet-500',
          text: 'text-violet-500',
          progress: 'bg-violet-500',
          gradient: 'from-violet-500/20 to-fuchsia-500/5'
        };
      default:
        return {
          bg: 'bg-slate-500/5 hover:bg-slate-500/10 border-slate-500/20 hover:border-slate-500/40',
          iconBg: 'bg-slate-500/10 text-slate-500',
          text: 'text-slate-500',
          progress: 'bg-slate-500',
          gradient: 'from-slate-500/20 to-zinc-500/5'
        };
    }
  };

  const renderCreateModal = () => {
    if (!showCreateForm) return null;
    return (
      <Portal>
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 max-w-md w-full shadow-lg relative animate-float">
            
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <div className="p-2 bg-secondary text-primary rounded-md">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-lg text-foreground">Create Roadmap Track</h3>
                <p className="text-xs text-muted-foreground">Setup custom learning pathways and milestones.</p>
              </div>
            </div>

            <form onSubmit={handleCreateRoadmap} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-outfit">Roadmap Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Node.js Backend Curriculum"
                  value={newRoadmapTitle}
                  onChange={(e) => setNewRoadmapTitle(e.target.value)}
                  className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-outfit">Subject Category</label>
                <select
                  value={newRoadmapSubject}
                  onChange={(e) => setNewRoadmapSubject(e.target.value)}
                  className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors font-semibold"
                >
                  <option value="Node.js">Node.js</option>
                  <option value="React">React</option>
                  <option value="Python">Python</option>
                  <option value="DSA">DSA</option>
                  <option value="AI/Data Science">AI/Data Science</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-secondary text-secondary-foreground border border-input rounded-md hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRoadmap}
                  className="flex-1 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm uppercase tracking-wider font-bold"
                >
                  {isSavingRoadmap ? 'Creating...' : 'Create Roadmap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    );
  };

  const renderAiModal = () => {
    if (!showAiForm) return null;
    return (
      <Portal>
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 max-w-md w-full shadow-lg relative animate-float">
            
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-md">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-lg text-foreground">AI Bot Roadmap Generator</h3>
                <p className="text-xs text-muted-foreground">Paste a syllabus, URL, or subject to generate.</p>
              </div>
            </div>

            <form onSubmit={handleGenerateRoadmap} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-outfit">Syllabus / Prompt</label>
                <textarea
                  required
                  placeholder="e.g. Learn Advanced Next.js, or paste a course description here..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={5}
                  className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-outfit">Subject Category</label>
                <select
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-indigo-500 transition-colors font-semibold"
                >
                  <option value="Node.js">Node.js</option>
                  <option value="React">React</option>
                  <option value="Python">Python</option>
                  <option value="DSA">DSA</option>
                  <option value="AI/Data Science">AI/Data Science</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAiForm(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-secondary text-secondary-foreground border border-input rounded-md hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 py-2 text-xs font-semibold bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-all shadow-sm uppercase tracking-wider font-bold"
                >
                  {isGenerating ? 'Crafting Roadmap...' : 'Generate 🤖'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Loading Learning Roadmaps…</span>
      </div>
    );
  }

  // --- DASHBOARD SUBJECTS GRID VIEW ---
  if (!subject) {
    const subjectsMap = {};
    const ALL_SUBJECTS = ['Node.js', 'React', 'Python', 'DSA', 'AI/Data Science', 'General'];

    ALL_SUBJECTS.forEach(sub => {
      subjectsMap[sub] = {
        subject: sub,
        roadmaps: [],
        totalSteps: 0,
        completedSteps: 0,
        percent: 0,
        courseCount: 0
      };
    });

    roadmaps.forEach(rm => {
      const sub = rm.subject || 'General';
      if (!subjectsMap[sub]) {
        subjectsMap[sub] = {
          subject: sub,
          roadmaps: [],
          totalSteps: 0,
          completedSteps: 0,
          percent: 0,
          courseCount: 0
        };
      }
      subjectsMap[sub].roadmaps.push(rm);
      const total = rm.items?.length || 0;
      const completed = rm.items?.filter(item => item.status === 'Completed').length || 0;
      subjectsMap[sub].totalSteps += total;
      subjectsMap[sub].completedSteps += completed;
    });

    Object.keys(subjectsMap).forEach(sub => {
      const data = subjectsMap[sub];
      data.courseCount = data.roadmaps.length;
      data.percent = data.totalSteps > 0 ? Math.round((data.completedSteps / data.totalSteps) * 100) : 0;
    });

    const activeSubjects = Object.values(subjectsMap).filter(data => data.roadmaps.length > 0);

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-outfit font-extrabold text-2xl text-foreground">Developer Learning Roadmaps</h2>
            <p className="text-sm text-muted-foreground">Select a subject track to view your consolidated master learning pathway.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAiForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white font-bold rounded-xl text-sm hover:bg-indigo-600 transition-all shadow-md"
            >
              Generate with AI 🤖
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Create Track
            </button>
          </div>
        </div>

        {/* Grid of Subject Tracks */}
        {activeSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border text-center">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-4">
              <GitFork className="w-12 h-12 animate-pulse" />
            </div>
            <h3 className="font-outfit font-bold text-lg mb-1">No Active Subject Tracks</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              You haven't imported any courses yet! Go to Playlist Classes to import a course and generate its roadmap automatically.
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Youtube className="w-4 h-4" />
              Go to Playlist Classes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {activeSubjects.map((subData) => {
              const styles = getSubjectStyles(subData.subject);
              return (
                <div
                  key={subData.subject}
                  onClick={() => navigate(`/${encodeURIComponent(subData.subject.toLowerCase())}`)}
                  className={`group relative overflow-hidden border rounded-2xl p-6 shadow-sm cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md ${styles.bg}`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${styles.gradient} rounded-full filter blur-2xl opacity-50 -mr-10 -mt-10`} />

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${styles.iconBg}`}>
                        <GitFork className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-outfit font-extrabold text-lg text-foreground">{subData.subject} Track</h3>
                        <p className="text-xs text-muted-foreground">Consolidated Timeline</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>{subData.courseCount} {subData.courseCount === 1 ? 'Class' : 'Classes'} • {subData.totalSteps} {subData.totalSteps === 1 ? 'Step' : 'Steps'}</span>
                      <span className="font-bold text-foreground">{subData.percent}% Complete</span>
                    </div>

                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${styles.progress}`}
                        style={{ width: `${subData.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {renderCreateModal()}
        {renderAiModal()}
      </div>
    );
  }

  // --- UNIFIED ROADMAP VIEW FOR A SPECIFIC SUBJECT ---
  const targetLower = (subject || '').toLowerCase();
  const filteredRoadmaps = roadmaps.filter(rm => (rm.subject || 'General').toLowerCase() === targetLower);
  
  // Use the original casing from the database if available
  const activeSubject = filteredRoadmaps.length > 0 ? (filteredRoadmaps[0].subject || 'General') : (subject || 'General');

  // Sort chronologically by created_at
  filteredRoadmaps.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // Compute total stats
  let totalItems = 0;
  let completedItems = 0;
  filteredRoadmaps.forEach(rm => {
    totalItems += rm.items?.length || 0;
    completedItems += rm.items?.filter(item => item.status === 'Completed').length || 0;
  });
  const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/roadmaps')}
            className="p-2.5 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors shrink-0"
            title="Back to Roadmaps"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-outfit font-extrabold text-2xl text-foreground">{activeSubject} Master Roadmap Track 🚀</h2>
            <p className="text-sm text-muted-foreground">Unified timeline of all your imported {activeSubject} classes.</p>
          </div>
        </div>
      </div>

      {/* Unified Progress Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-outfit font-bold text-lg text-foreground">Track Completion Progress</h3>
            <p className="text-xs text-muted-foreground">{completedItems} of {totalItems} milestone steps finished</p>
          </div>
          <div className="text-right">
            <span className="font-outfit font-extrabold text-3xl text-primary">{percent}%</span>
          </div>
        </div>

        <div className="w-full bg-secondary rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {percent === 100 && totalItems > 0 && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-center flex items-center justify-center gap-2 text-sm font-bold animate-bounce shadow-sm">
            <Award className="w-5 h-5 animate-spin" />
            {activeSubject} Master Track Certificate Unlocked! 🏆
          </div>
        )}
      </div>

      {/* Merged Timelines list */}
      {filteredRoadmaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border text-center">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-4">
            <GitFork className="w-12 h-12" />
          </div>
          <h3 className="font-outfit font-bold text-lg mb-1">No Roadmaps Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            There are no roadmaps created under the "{activeSubject}" subject category yet.
          </p>
          <div className="flex gap-4 mt-2">
            <button
              onClick={() => setShowAiForm(true)}
              className="px-5 py-2.5 bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-sm"
            >
              Generate with AI 🤖
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-sm"
            >
              Create Manual Track
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredRoadmaps.map((roadmap) => {
            const rmTotal = roadmap.items?.length || 0;
            const rmCompleted = roadmap.items?.filter(item => item.status === 'Completed').length || 0;
            const rmPercent = rmTotal > 0 ? Math.round((rmCompleted / rmTotal) * 100) : 0;

            return (
              <div
                key={roadmap.id}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Roadmap Title Section */}
                  <div className="flex items-start justify-between border-b border-border pb-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                        <GitFork className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-outfit font-extrabold text-base text-foreground">{roadmap.title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Chronological Module Segment</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-primary">{rmCompleted} / {rmTotal} Steps</p>
                        <p className="text-[9px] text-muted-foreground">{rmPercent}% Complete</p>
                      </div>
                      <button
                        onClick={() => handleDeleteRoadmap(roadmap.id)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all shrink-0"
                        title="Delete Course Roadmap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Milestones Vertical List */}
                  {rmTotal > 0 ? (
                    <div className="relative border-l border-border pl-5 ml-2.5 space-y-4 mb-6">
                      {roadmap.items?.map((item) => {
                        const isCompleted = item.status === 'Completed';
                        const isInProgress = item.status === 'In Progress';

                        return (
                          <div key={item.id} className="relative group animate-in fade-in duration-200">
                            {/* Toggle Checkbox Button */}
                            <button
                              onClick={() => handleToggleItemStatus(item.id)}
                              className={`absolute -left-[27.5px] top-1.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all cursor-pointer z-10 ${
                                isCompleted
                                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm font-bold animate-pulse'
                                  : isInProgress
                                  ? 'bg-orange-500 border-orange-600 text-white shadow-sm font-bold'
                                  : 'bg-card border-border hover:border-primary text-transparent'
                              }`}
                              title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
                            >
                              <span className="text-[8px] font-extrabold select-none">
                                {isCompleted ? '✓' : ''}
                              </span>
                            </button>

                            {/* Item Row block */}
                            <div className={`p-3 rounded-xl border text-xs leading-relaxed transition-all flex items-center justify-between ${
                              isCompleted
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : isInProgress
                                ? 'bg-orange-500/5 border-orange-500/20'
                                : 'bg-card/40 border-border'
                            }`}>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground truncate">{item.title}</span>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    isCompleted
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : isInProgress
                                      ? 'bg-orange-500/10 text-orange-600'
                                      : 'bg-slate-500/10 text-muted-foreground'
                                  }`}>
                                    {item.status}
                                  </span>
                                </div>

                                {item.video_title && (
                                  <div className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
                                    <BookOpen className="w-2.5 h-2.5 text-primary shrink-0" />
                                    <span className="truncate max-w-[350px]">{item.video_title}</span>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove Step"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No steps added yet. Add a milestone below!</p>
                  )}

                  {/* Inline Form to Add Steps */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border mt-4">
                    <input
                      type="text"
                      placeholder="Add milestone step..."
                      value={itemInputs[roadmap.id] || ''}
                      onChange={(e) => handleInputChange(roadmap.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddItem(roadmap.id);
                      }}
                      className="flex-grow bg-secondary border border-input rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => handleAddItem(roadmap.id)}
                      className="p-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition-all"
                      title="Add Step"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {renderCreateModal()}
      {renderAiModal()}
    </div>
  );
}

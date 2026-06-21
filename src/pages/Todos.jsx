import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API_URL, formatDate } from '../App';
import DatePicker from '../components/DatePicker';
import { 
  CheckSquare, Plus, Trash2, Calendar, RefreshCw, AlertCircle, 
  Search, Check, Filter, ClipboardList, Info, Sparkles
} from 'lucide-react';

export default function Todos() {
  const { token, fetchStats, showToast } = useContext(AuthContext);

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'today', 'upcoming', 'past_due', 'completed'
  const [categoryFilter, setCategoryFilter] = useState('All'); // 'All', 'Node.js', 'Python', 'DSA', 'AI', 'Personal Learning'
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('Node.js');
  
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatAttendanceDate = (dateStr) => {
    if (!dateStr) return '';
    const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  const [dueDate, setDueDate] = useState(getLocalDateString());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('Daily');

  const [formError, setFormError] = useState('');

  const fetchTodos = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/todos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (err) {
      console.error('Error fetching todos:', err);
      showToast?.('Failed to retrieve task checklist.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [token]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Task description title is required.');
      return;
    }
    setFormError('');

    try {
      const res = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          priority,
          category,
          due_date: dueDate,
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurrencePattern : null
        })
      });

      if (res.ok) {
        setTitle('');
        setIsRecurring(false);
        await fetchTodos();
        await fetchStats();
        showToast?.('Study task added successfully!', 'success');
      } else {
        const data = await res.json();
        setFormError(data.message || 'Failed to create task');
      }
    } catch (err) {
      setFormError('Network error creating task.');
    }
  };

  const handleToggleTodo = async (todo) => {
    try {
      const res = await fetch(`${API_URL}/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          is_completed: !todo.is_completed
        })
      });
      if (res.ok) {
        await fetchTodos();
        await fetchStats();
        showToast?.(`Task marked as ${!todo.is_completed ? 'completed' : 'incomplete'}!`, 'success');
      } else {
        const data = await res.json();
        showToast?.(data.message || 'Failed to toggle task status', 'error');
      }
    } catch (err) {
      showToast?.('Error updating task: ' + err.message, 'error');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const res = await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchTodos();
        await fetchStats();
        showToast?.('Task deleted.', 'info');
      } else {
        const data = await res.json();
        showToast?.(data.message || 'Failed to delete task', 'error');
      }
    } catch (err) {
      showToast?.('Error deleting task: ' + err.message, 'error');
    }
  };

  // Date parsing tools for filtering
  const todayStr = getLocalDateString();

  const filteredTodos = todos.filter(todo => {
    // 1. Tab filtering
    const todoDateOnly = todo.due_date ? todo.due_date.split('T')[0] : '';
    
    if (activeTab === 'today') {
      if (todoDateOnly !== todayStr) return false;
    } else if (activeTab === 'upcoming') {
      if (todoDateOnly <= todayStr || todo.is_completed) return false;
    } else if (activeTab === 'past_due') {
      if (todoDateOnly >= todayStr || todo.is_completed) return false;
    } else if (activeTab === 'completed') {
      if (!todo.is_completed) return false;
    }

    // 2. Category filtering
    if (categoryFilter !== 'All' && todo.category !== categoryFilter) {
      return false;
    }

    // 3. Search query filtering
    if (searchQuery.trim() && !todo.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-foreground">Study Tasks</h2>
          <p className="text-sm text-muted-foreground">Manage individual and recurring learning goals. Link progress with daily smart attendance.</p>
        </div>
      </div>

      {/* SMART ATTENDANCE INFO CALLOUT */}
      <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3.5 items-start">
        <div className="p-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-outfit font-bold text-sm text-emerald-800 dark:text-emerald-400">Smart Attendance Integration</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Code Clover calculates your daily attendance automatically. Completing at least <span className="font-bold text-emerald-600 dark:text-emerald-400">3 tasks</span> due today and logging <span className="font-bold text-emerald-600 dark:text-emerald-400">2.0+ focus hours</span> guarantees a <span className="font-bold text-emerald-600 dark:text-emerald-400">Present (✅)</span> status. Logged study hours above 1.0 hr result in a <span className="font-bold text-amber-500">Half Day (🟡)</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2/3 width): Filter & Tasks List */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-card text-card-foreground border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search study tasks..."
                className="w-full bg-background border border-input rounded-md py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-background border border-input rounded-md py-1.5 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
              >
                <option value="All">All Categories</option>
                <option value="Node.js">Node.js</option>
                <option value="Python">Python</option>
                <option value="DSA">DSA</option>
                <option value="AI">AI</option>
                <option value="Personal Learning">Personal Learning</option>
              </select>
            </div>
          </div>

          {/* FILTER TAB BAR */}
          <div className="flex border-b border-border text-xs font-semibold text-muted-foreground overflow-x-auto whitespace-nowrap">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'today', label: "Today's Target" },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'past_due', label: 'Past Due' },
              { id: 'completed', label: 'Archived Completed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 border-b-2 transition-all hover:text-foreground ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary font-bold' 
                    : 'border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TASKS LIST */}
          <div className="space-y-2.5">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredTodos.length > 0 ? (
              filteredTodos.map(todo => {
                let priorityCls = '';
                if (todo.priority === 'High') {
                  priorityCls = 'bg-red-500/10 text-red-500 border-red-500/20';
                } else if (todo.priority === 'Medium') {
                  priorityCls = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                } else {
                  priorityCls = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                }

                const todoDateOnly = todo.due_date ? todo.due_date.split('T')[0] : '';
                const isOverdue = todoDateOnly < todayStr && !todo.is_completed;

                return (
                  <div 
                    key={todo.id}
                    className="clover-card p-4 flex items-center justify-between gap-4 hover:border-primary/20 transition-all group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleTodo(todo)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                          todo.is_completed 
                            ? 'bg-primary border-primary text-primary-foreground font-bold' 
                            : 'border-input hover:border-primary/60 bg-background'
                        }`}
                      >
                        {todo.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <p className={`text-sm font-semibold text-foreground truncate ${
                          todo.is_completed ? 'line-through text-muted-foreground font-normal' : ''
                        }`}>
                          {todo.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${priorityCls}`}>
                            {todo.priority}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded border border-border">
                            {todo.category}
                          </span>
                          {todo.is_recurring && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded flex items-center gap-1">
                              <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                              <span>{todo.recurrence_pattern}</span>
                            </span>
                          )}
                          <span className={`text-[10px] font-medium flex items-center gap-1 ${isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                            <Calendar className="w-3 h-3" />
                            {todoDateOnly === todayStr ? 'Today' : formatAttendanceDate(todo.due_date)}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-card border border-border rounded-xl shadow-sm">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <h4 className="font-outfit font-bold text-sm text-foreground">No tasks matches your filters</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                  Enjoy consistency or schedule a new task to resume study streaks.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN (1/3 width): Add Task Panel */}
        <div className="space-y-6">
          
          <div className="clover-card p-6 flex flex-col justify-between">
            <div className="w-full">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <div className="p-2 bg-secondary text-primary rounded-md border border-border/40">
                  <CheckSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-base text-foreground">Task Scheduler</h3>
                  <p className="text-xs text-muted-foreground">Setup target topics and track completions.</p>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 bg-destructive/10 text-destructive p-3.5 border border-destructive/20 rounded-md text-xs mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddTodo} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Task Description Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Code clover dashboard routing"
                    className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-all"
                    >
                      <option value="High">🔴 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-all"
                    >
                      <option value="Node.js">Node.js</option>
                      <option value="Python">Python</option>
                      <option value="DSA">DSA</option>
                      <option value="AI">AI</option>
                      <option value="Personal Learning">Personal Learning</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Scheduled Due Date</label>
                  <DatePicker 
                    value={dueDate}
                    onChange={(v) => setDueDate(v)}
                    placeholder="Select due date"
                  />
                </div>

                {/* Recurrence Settings */}
                <div className="border border-border/60 bg-muted/10 p-3 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Recurring Checklist Task?</span>
                    <button
                      type="button"
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={`w-8 h-4.5 rounded-full transition-all relative shrink-0 ${
                        isRecurring ? 'bg-primary' : 'bg-input'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-background absolute top-0.5 transition-all ${
                        isRecurring ? 'left-4' : 'left-0.5'
                      }`} />
                    </button>
                  </div>

                  {isRecurring && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Recurrence Pattern</label>
                      <select
                        value={recurrencePattern}
                        onChange={(e) => setRecurrencePattern(e.target.value)}
                        className="w-full bg-background border border-input rounded-md py-1.5 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-all"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                      </select>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

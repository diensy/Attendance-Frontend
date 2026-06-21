import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API_URL, formatDate } from '../App';
import DatePicker from '../components/DatePicker';
import Portal from '../components/Portal';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Flame, Award, Calendar, Clock, GitBranch, Github, FileText, 
  FileSpreadsheet, Sparkles, RefreshCw, Plus, CheckCircle2, ChevronRight, UserPlus,
  Clover, Trash2, Check, BookOpen, BarChart3
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { token, user, stats, fetchStats, updateProfile, showToast } = useContext(AuthContext);

  // Local timezone-correct date helper
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

  // Todo states
  const [todos, setTodos] = useState([]);
  const [loadingTodos, setLoadingTodos] = useState(false);
  const [todoTitle, setTodoTitle] = useState('');
  const [todoPriority, setTodoPriority] = useState('Medium');
  const [todoCategory, setTodoCategory] = useState('Node.js');
  const [todoDueDate, setTodoDueDate] = useState(getLocalDateString());
  const [todoIsRecurring, setTodoIsRecurring] = useState(false);
  const [todoRecurrencePattern, setTodoRecurrencePattern] = useState('Daily');

  // Local dashboard states
  const [analytics, setAnalytics] = useState({
    todayFocusSeconds: 0,
    weekFocusHours: 0,
    longestSessionSeconds: 0,
    productivityScore: 0,
    subjectDistribution: [],
    focusTrend: []
  });
  
  const [github, setGithub] = useState({
    hasUsername: false,
    username: '',
    repos: [],
    commits: [],
    isMocked: false
  });

  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [githubInput, setGithubInput] = useState('');
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Manual attendance form state
  const [showManualLog, setShowManualLog] = useState(false);
  const [manualDate, setManualDate] = useState(getLocalDateString());
  const [manualHours, setManualHours] = useState(1);
  const [manualNotes, setManualNotes] = useState('');

  // AI insights report state
  const [aiReport, setAiReport] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [dashboardCourses, setDashboardCourses] = useState([]);
  const [dashboardSmartGoals, setDashboardSmartGoals] = useState([]);

  const fetchTodos = async () => {
    if (!token) return;
    setLoadingTodos(true);
    try {
      const todayStr = getLocalDateString();
      const res = await fetch(`${API_URL}/todos?date=${todayStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (err) {
      console.error('Error fetching todos:', err);
    } finally {
      setLoadingTodos(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!todoTitle.trim()) return;
    try {
      const res = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: todoTitle,
          priority: todoPriority,
          category: todoCategory,
          due_date: todoDueDate,
          is_recurring: todoIsRecurring,
          recurrence_pattern: todoIsRecurring ? todoRecurrencePattern : null
        })
      });
      if (res.ok) {
        setTodoTitle('');
        setTodoIsRecurring(false);
        // Refresh list and stats
        await fetchTodos();
        await fetchDashboardData();
        showToast?.('Task created successfully!', 'success');
      } else {
        const data = await res.json();
        showToast?.(data.message || 'Failed to create task', 'error');
      }
    } catch (err) {
      showToast?.('Error creating task: ' + err.message, 'error');
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
        await fetchDashboardData();
        showToast?.(`Task marked as ${!todo.is_completed ? 'completed' : 'incomplete'}!`, 'success');
      } else {
        const data = await res.json();
        showToast?.(data.message || 'Failed to update task', 'error');
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
        await fetchDashboardData();
        showToast?.('Task deleted.', 'info');
      } else {
        const data = await res.json();
        showToast?.(data.message || 'Failed to delete task', 'error');
      }
    } catch (err) {
      showToast?.('Error deleting task: ' + err.message, 'error');
    }
  };

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoadingAnalytics(true);
    try {
      // 1. Fetch Focus Timer Analytics
      const analRes = await fetch(`${API_URL}/timer/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (analRes.ok) {
        const analData = await analRes.json();
        setAnalytics(analData);
      }

      // 2. Fetch GitHub Sync
      const gitRes = await fetch(`${API_URL}/github`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (gitRes.ok) {
        const gitData = await gitRes.json();
        setGithub(gitData);
        if (gitData.hasUsername) {
          setGithubInput(gitData.username);
        }
      }

      // 3. Fetch Attendance Logs
      const logsRes = await fetch(`${API_URL}/attendance/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAttendanceLogs(logsData);
      }

      // Fetch courses for Dashboard widget
      const courseRes = await fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (courseRes.ok) {
        setDashboardCourses(await courseRes.json());
      }

      // Fetch smart goals for analytics
      const sgRes = await fetch(`${API_URL}/smart-goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sgRes.ok) {
        setDashboardSmartGoals(await sgRes.json());
      }

      // 4. Fetch Todos
      await fetchTodos();

      // 5. Update core stats
      await fetchStats();

    } catch (err) {
      console.error('Error fetching dashboard datasets:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Handle GitHub Account synchronization
  const handleGithubSync = async (e) => {
    e.preventDefault();
    if (!githubInput.trim()) return;

    setSyncingGithub(true);
    try {
      await updateProfile(githubInput.trim());
      // Refetch stats and dashboard
      await fetchDashboardData();
      showToast?.('GitHub profile updated successfully!', 'success');
    } catch (err) {
      showToast?.('Error updating GitHub profile: ' + err.message, 'error');
    } finally {
      setSyncingGithub(false);
    }
  };

  // Manual log submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/attendance/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: manualDate,
          status: 'Present',
          study_hours: Number(manualHours),
          daily_notes: manualNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to manually log');

      setShowManualLog(false);
      setManualNotes('');
      // Refetch
      await fetchDashboardData();
      showToast?.('Attendance logged successfully!', 'success');
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  // Trigger Daily AI summary builder
  const handleGenerateAiSummary = async () => {
    setGeneratingAi(true);
    try {
      const res = await fetch(`${API_URL}/ai/daily-summary`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI Synthesis failed');
      
      // Update attendance list
      await fetchDashboardData();
      showToast?.('AI daily synthesis generated successfully!', 'success');
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Export report helpers
  const handleDownloadPDF = () => {
    window.open(`${API_URL}/reports/pdf?token=${token}`, '_blank');
  };

  const handleDownloadExcel = () => {
    window.open(`${API_URL}/reports/excel?token=${token}`, '_blank');
  };

  // Pie chart variables
  const COLORS = ['#2E7D32', '#4CAF50', '#A5D6A7', '#1B5E20', '#C8E6C9'];
  
  const chartData = analytics.subjectDistribution.length > 0
    ? analytics.subjectDistribution
    : [
        { subject: 'Node.js', hours: 0 },
        { subject: 'Python', hours: 0 },
        { subject: 'DSA', hours: 0 },
        { subject: 'AI/Data Science', hours: 0 }
      ];

  const hasSubjectData = analytics.subjectDistribution.some(item => item.hours > 0);

  // Smart Goals Analytics computations
  const sgCompleted = dashboardSmartGoals.filter(g => g.status === 'Completed').length;
  const sgInterrupted = dashboardSmartGoals.filter(g => g.status === 'Interrupted').length;
  const sgTotalFinished = sgCompleted + sgInterrupted;
  const sgCompletionRate = sgTotalFinished === 0 ? 0 : Math.round((sgCompleted / sgTotalFinished) * 100);

  const sgQuitReasons = dashboardSmartGoals.filter(g => g.quit_reason).map(g => g.quit_reason);
  const sgReasonsCount = sgQuitReasons.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 pb-12">
      
      {/* HEADER METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        
        {/* Metric 1: Streak */}
        <div className="clover-card p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Consecutive Streak</span>
            <div className="p-1.5 bg-secondary text-amber-500 rounded-md border border-border/40">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div>
            <h3 className="font-outfit font-extrabold text-2xl text-foreground">{stats.streak || 0} Days</h3>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">Growth luck is compounding!</p>
          </div>
        </div>

        {/* Metric 2: Attendance Rate */}
        <div className="clover-card p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attendance Rate</span>
            <div className="p-1.5 bg-secondary text-primary rounded-md border border-border/40">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-outfit font-extrabold text-2xl text-foreground">{stats.attendancePercentage || 0}%</h3>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">Target consistency: &gt; 80%</p>
          </div>
        </div>

        {/* Metric 3: Topics Learned Today */}
        <div className="clover-card p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Topics Learned</span>
            <div className="p-1.5 bg-secondary text-indigo-500 rounded-md border border-border/40">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-outfit font-extrabold text-2xl text-foreground">
              {(stats.topicsLearnedToday && stats.topicsLearnedToday.length) || 0} Topics
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              {stats.topicsLearnedToday && stats.topicsLearnedToday.length > 0
                ? stats.topicsLearnedToday.join(', ')
                : 'No focus topics logged'}
            </p>
          </div>
        </div>

        {/* Metric 4: Todos Completed */}
        <div className="clover-card p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Todos Completed</span>
            <div className="p-1.5 bg-secondary text-emerald-500 rounded-md border border-border/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-outfit font-extrabold text-2xl text-foreground">
              {stats.todosCompletedToday || 0}/{stats.todosTotalToday || 0}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">Today's checklist progress</p>
          </div>
        </div>

        {/* Metric 5: Focus Time Today */}
        <div className="clover-card p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Focus Time Today</span>
            <div className="p-1.5 bg-secondary text-sky-500 rounded-md border border-border/40">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-outfit font-extrabold text-2xl text-foreground">
              {stats.todayFocusSeconds ? `${(stats.todayFocusSeconds / 3600).toFixed(1)} hrs` : '0.0 hrs'}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              {stats.todayFocusSeconds ? `${Math.round(stats.todayFocusSeconds / 60)} mins focused` : 'Target: 2 hours study'}
            </p>
          </div>
        </div>

        {/* Metric 6: GitHub Commits */}
        <div className="clover-card p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GitHub Commits</span>
            <div className="p-1.5 bg-secondary text-foreground rounded-md border border-border/40">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-outfit font-extrabold text-2xl text-foreground">
              {stats.todayCommits || 0} Commits
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">Today's synced commits</p>
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS PANEL */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-card text-card-foreground border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => setActiveTab('timer')}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm"
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Launch Focus Timer</span>
          </button>
          
          <button 
            onClick={() => setShowManualLog(true)}
            className="flex items-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Manual Attendance</span>
          </button>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 border border-destructive/20 bg-destructive/10 hover:bg-destructive/15 text-destructive px-3.5 py-2 rounded-md text-xs font-semibold transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Report</span>
          </button>

          <button 
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 border border-primary/20 bg-primary/10 hover:bg-primary/15 text-primary px-3.5 py-2 rounded-md text-xs font-semibold transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Sheet</span>
          </button>
        </div>
      </div>

      {/* ACTIVE COURSE PROGRESS PANEL */}
      {dashboardCourses.length > 0 && (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-outfit font-extrabold text-sm text-foreground">Current Course: {dashboardCourses[0].title}</h3>
                <p className="text-[10px] text-muted-foreground">Self-paced playlist progress</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('courses')}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all"
            >
              <span>Resume Study</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>{dashboardCourses[0].completed_videos} / {dashboardCourses[0].total_videos} Videos Watched</span>
              <span>{Math.round((dashboardCourses[0].completed_videos / dashboardCourses[0].total_videos) * 100)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.round((dashboardCourses[0].completed_videos / dashboardCourses[0].total_videos) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Focus Trends (Bar chart) */}
        <div className="clover-card p-6">
          <h3 className="font-outfit font-bold text-base text-foreground mb-6">Weekly Study Trend (Hours focused)</h3>
          
          {loadingAnalytics ? (
            <div className="h-64 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.focusTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))' }}
                    formatter={(value) => [`${value} hrs`, 'Focused Study']}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Subject Distribution (Pie chart) */}
        <div className="clover-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-outfit font-bold text-base text-foreground mb-2">Subject Distribution</h3>
            <p className="text-xs text-muted-foreground mb-6">Focused study hours by category.</p>
          </div>

          <div className="h-44 relative flex items-center justify-center">
            {hasSubjectData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="hours"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} hrs`, 'Study Time']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <Clover className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2 animate-float" />
                <span className="text-xs text-muted-foreground">No subject tracking logged yet.</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 mt-4">
            {chartData.map((item, idx) => (
              <div key={item.subject} className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span>{item.subject}</span>
                </div>
                <span className="text-foreground">{item.hours} hrs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Productivity Breakdown Card */}
        <div className="clover-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-outfit font-bold text-base text-foreground mb-1">Productivity Breakdown</h3>
                <p className="text-xs text-muted-foreground">Today's weighted score performance.</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Score</span>
                <h4 className="font-outfit font-extrabold text-2xl text-primary">{stats.productivityScore || 0}/100</h4>
              </div>
            </div>

            {/* Breakdown progress items */}
            <div className="space-y-4 mt-6">
              {/* 1. Attendance (30 pts) */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground">Attendance (30 pts)</span>
                  <span className="text-muted-foreground">{(stats.productivityBreakdown?.attendance ?? (stats.todayStatus === 'Present' ? 30 : stats.todayStatus === 'Half Day' ? 15 : 0))} / 30</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 relative overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${(((stats.productivityBreakdown?.attendance ?? (stats.todayStatus === 'Present' ? 30 : stats.todayStatus === 'Half Day' ? 15 : 0))) / 30) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                  <span>Status: {stats.todayStatus || 'Absent'}</span>
                  <span>{stats.todayStatus === 'Present' ? 'Full Points!' : stats.todayStatus === 'Half Day' ? 'Half Points' : '0 Points'}</span>
                </div>
              </div>

              {/* 2. Focus Time (25 pts) */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground">Focus Time (25 pts)</span>
                  <span className="text-muted-foreground">{(stats.productivityBreakdown?.focusTime ?? Math.min(25, Number(((stats.todayFocusSeconds || 0) / 7200) * 25).toFixed(1)))} / 25</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 relative overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-sky-500 transition-all duration-500" 
                    style={{ width: `${(((stats.productivityBreakdown?.focusTime ?? Math.min(25, ((stats.todayFocusSeconds || 0) / 7200) * 25))) / 25) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                  <span>Logged: {stats.todayFocusSeconds ? `${(stats.todayFocusSeconds / 3600).toFixed(2)} hrs` : '0 hrs'}</span>
                  <span>Target: 2.0 hrs</span>
                </div>
              </div>

              {/* 3. Todo Completion (25 pts) */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground">Todo Completion (25 pts)</span>
                  <span className="text-muted-foreground">{(stats.productivityBreakdown?.todos ?? (stats.todosTotalToday > 0 ? Number(((stats.todosCompletedToday || 0) / stats.todosTotalToday) * 25).toFixed(1) : 0))} / 25</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 relative overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${(((stats.productivityBreakdown?.todos ?? (stats.todosTotalToday > 0 ? ((stats.todosCompletedToday || 0) / stats.todosTotalToday) * 25 : 0))) / 25) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                  <span>Completed: {stats.todosCompletedToday || 0}/{stats.todosTotalToday || 0} tasks</span>
                  <span>{stats.todosTotalToday === 0 ? 'No tasks scheduled (0 pts)' : `${Math.round(((stats.todosCompletedToday || 0) / (stats.todosTotalToday || 1)) * 100)}% done`}</span>
                </div>
              </div>

              {/* 4. GitHub Activity (20 pts) */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground">GitHub Commits (20 pts)</span>
                  <span className="text-muted-foreground">{(stats.productivityBreakdown?.github ?? (stats.todayCommits >= 3 ? 20 : stats.todayCommits === 2 ? 14 : stats.todayCommits === 1 ? 8 : 0))} / 20</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 relative overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-amber-500 transition-all duration-500" 
                    style={{ width: `${(((stats.productivityBreakdown?.github ?? (stats.todayCommits >= 3 ? 20 : stats.todayCommits === 2 ? 14 : stats.todayCommits === 1 ? 8 : 0))) / 20) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                  <span>Commits: {stats.todayCommits || 0} today</span>
                  <span>Target: &ge; 3 commits</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-6 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Keep learning to top the score!
            </span>
          </div>
        </div>

      </div>

      {/* TODO MANAGER WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Today's Tasks List */}
        <div className="lg:col-span-2 clover-card p-6 flex flex-col justify-between">
          <div className="w-full">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h3 className="font-outfit font-bold text-base text-foreground">Today's Tasks Checklist</h3>
                <p className="text-xs text-muted-foreground">Log tasks, prioritize, and toggle completion to update your score.</p>
              </div>
              <span className="text-xs font-bold text-secondary-foreground bg-secondary px-3 py-1 rounded-full border border-border">
                {todos.filter(t => t.is_completed).length} / {todos.length} Completed
              </span>
            </div>

            {loadingTodos ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : todos.length > 0 ? (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {todos.map(todo => {
                  let priorityCls = '';
                  if (todo.priority === 'High') {
                    priorityCls = 'bg-red-500/10 text-red-500 border-red-500/20';
                  } else if (todo.priority === 'Medium') {
                    priorityCls = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                  } else {
                    priorityCls = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                  }

                  return (
                    <div 
                      key={todo.id}
                      className="p-3.5 rounded-xl bg-muted/20 border border-border flex items-center justify-between gap-3.5 hover:border-primary/20 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox button */}
                        <button
                          onClick={() => handleToggleTodo(todo)}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                            todo.is_completed 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'border-input hover:border-primary/60 bg-background'
                          }`}
                        >
                          {todo.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0">
                          <p className={`text-xs font-semibold text-foreground truncate ${
                            todo.is_completed ? 'line-through text-muted-foreground font-medium' : ''
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
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed border-border my-2">
                <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <h4 className="font-outfit font-bold text-xs text-foreground">No tasks scheduled for today</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                  Add tasks in the quick creator panel to optimize your productivity schedule.
                </p>
              </div>
            )}
          </div>
          <div></div> {/* placeholder for flex space */}
        </div>

        {/* Right: Add Task Form */}
        <div className="clover-card p-6 flex flex-col justify-between">
          <div className="w-full">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
              <div className="p-1.5 bg-secondary text-primary rounded-md border border-border/40">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-base text-foreground">Quick Task Creator</h3>
                <p className="text-xs text-muted-foreground">Add individual or recurring study tasks.</p>
              </div>
            </div>

            <form onSubmit={handleAddTodo} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Task Title</label>
                <input 
                  type="text"
                  value={todoTitle}
                  onChange={(e) => setTodoTitle(e.target.value)}
                  placeholder="e.g. Solve binary search problems"
                  className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={todoPriority}
                    onChange={(e) => setTodoPriority(e.target.value)}
                    className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-all"
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={todoCategory}
                    onChange={(e) => setTodoCategory(e.target.value)}
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
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Due Date</label>
                <DatePicker 
                  value={todoDueDate}
                  onChange={(val) => setTodoDueDate(val)}
                  placeholder="Select due date"
                />
              </div>

              {/* Recurrence setting */}
              <div className="border border-border/60 bg-muted/10 p-3 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Recurring task?</span>
                  <button
                    type="button"
                    onClick={() => setTodoIsRecurring(!todoIsRecurring)}
                    className={`w-8 h-4.5 rounded-full transition-all relative shrink-0 ${
                      todoIsRecurring ? 'bg-primary' : 'bg-input'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-background absolute top-0.5 transition-all ${
                      todoIsRecurring ? 'left-4' : 'left-0.5'
                    }`} />
                  </button>
                </div>

                {todoIsRecurring && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Recurrence Pattern</label>
                    <select
                      value={todoRecurrencePattern}
                      onChange={(e) => setTodoRecurrencePattern(e.target.value)}
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
                className="w-full py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* GITHUB INTEGRATION PANEL */}
      <div className="clover-card p-6">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary text-foreground rounded-md border border-border">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-outfit font-bold text-base text-foreground">GitHub Activity Tracker</h3>
              <p className="text-xs text-muted-foreground">Synchronize commit streams and repository progress logs.</p>
            </div>
          </div>

          {github.hasUsername && (
            <div className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border">
              Synced: @{github.username}
            </div>
          )}
        </div>

        <form onSubmit={handleGithubSync} className="flex flex-wrap items-center gap-3 max-w-lg mb-6">
          <input
            type="text"
            value={githubInput}
            onChange={(e) => setGithubInput(e.target.value)}
            placeholder="Enter GitHub Username"
            className="flex-1 bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
            required
          />
          <button
            type="submit"
            disabled={syncingGithub}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-2 px-4 text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            {syncingGithub ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
            <span>Sync Account</span>
          </button>
        </form>

        {/* GitHub stats / repos / commits list */}
        {github.hasUsername ? (
          <div>
            {github.error && (
              <div className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-md p-3 text-xs flex items-start gap-2.5">
                <span className="font-bold shrink-0">⚠️ Notice:</span>
                <div>{github.error}</div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            
            {/* Repositories */}
            <div className="lg:col-span-1 space-y-4">
              <h4 className="font-outfit font-bold text-sm text-foreground">Featured Repositories</h4>
              <div className="space-y-3">
                {github.repos.slice(0, 3).map(repo => (
                  <a 
                    key={repo.id} 
                    href={repo.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block bg-muted/40 hover:bg-muted/70 p-3.5 rounded-md border border-border transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-outfit font-semibold text-xs text-foreground group-hover:text-primary truncate">{repo.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">{repo.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-[9px] font-bold text-muted-foreground">
                      <span>⭐ {repo.stars} stars</span>
                      <span>🔱 {repo.forks} forks</span>
                      <span className="px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-sm">{repo.language}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Recent Commits */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-outfit font-bold text-sm text-foreground">Recent Commits</h4>
                {github.isMocked && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 bg-secondary rounded border border-border">Simulation active</span>
                )}
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {github.commits.length > 0 ? (
                  github.commits.map(commit => (
                    <div 
                      key={commit.sha} 
                      className="bg-muted/30 p-3 rounded-md border border-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 overflow-hidden">
                        <span className="font-mono text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-sm shrink-0">
                          {commit.sha}
                        </span>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-foreground truncate">{commit.message}</p>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                            Repo: {commit.repo} • Author: {commit.author}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10.5px] font-bold text-muted-foreground whitespace-nowrap self-end md:self-auto">
                        {formatDate(commit.date)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No public push events found for this account.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
          <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
            <Github className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h4 className="font-outfit font-bold text-sm text-foreground">Connect GitHub Profile</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1.5 mb-5">
              Sync repository codebases and display recent commit actions on your learning dashboard.
            </p>
          </div>
        )}
      </div>

      {/* ATTENDANCE HISTORY LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance log grid lists */}
        <div className="lg:col-span-2 clover-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-outfit font-bold text-base text-foreground">Recent Attendance Logs</h3>
              <p className="text-xs text-muted-foreground">Verify dates, study hours, and notes.</p>
            </div>
            
            <button 
              onClick={handleGenerateAiSummary}
              disabled={generatingAi}
              className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50 transition-colors shrink-0"
            >
              {generatingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Synthesize Daily AI Summary</span>
            </button>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {attendanceLogs.length > 0 ? (
              attendanceLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-4 rounded-md bg-muted/30 border border-border flex items-start gap-4 hover:border-primary/25 transition-all"
                >
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold font-outfit text-xs ${
                    log.status === 'Present' ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                  }`}>
                    {log.status === 'Present' ? 'P' : 'A'}
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-outfit font-bold text-xs text-foreground">{formatAttendanceDate(log.date)}</span>
                      <span className="text-[10px] font-bold text-secondary-foreground bg-secondary px-2 py-0.5 rounded-sm">
                        {log.study_hours} hrs studied
                      </span>
                    </div>
                    {log.daily_notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">"{log.daily_notes}"</p>
                    )}
                    {log.ai_summary ? (
                      <div className="bg-primary/5 p-2.5 rounded-md border border-primary/15 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-[11px] text-primary leading-relaxed font-semibold">
                          <strong className="text-xs font-bold">Clover AI Summary:</strong> {log.ai_summary}
                        </p>
                      </div>
                    ) : (
                      log.status === 'Present' && (
                        <p className="text-[10px] text-muted-foreground">💡 Click the synthesize button above to summarize today's logs.</p>
                      )
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No attendance logs registered yet. Log present using the Timer!</p>
              </div>
            )}
          </div>
        </div>

        {/* Badges sidebar list */}
        <div className="clover-card p-6 space-y-6 flex flex-col">
          <div>
            <h3 className="font-outfit font-bold text-base text-foreground">Achievements & Badges</h3>
            <p className="text-xs text-muted-foreground">Milestones achieved via timer streaks.</p>
          </div>

          <div className="space-y-3.5 overflow-y-auto max-h-[420px] flex-grow pr-1">
            {stats.badges && stats.badges.length > 0 ? (
              stats.badges.map(badge => (
                <div 
                  key={badge.badge_name} 
                  className="bg-amber-500/5 dark:bg-amber-500/10 p-3.5 rounded-md border border-amber-500/15 flex items-center gap-3.5 group hover:border-amber-500/30 transition-all shadow-sm"
                >
                  <div className="w-10 h-10 bg-amber-500/20 text-amber-550 border border-amber-500/30 rounded-md flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-amber-550" />
                  </div>
                  <div>
                    <h4 className="font-outfit font-bold text-xs text-amber-600 dark:text-amber-400">{badge.badge_name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{badge.badge_description}</p>
                    <span className="text-[10.5px] font-bold text-muted-foreground/60 block mt-1.5 uppercase">Unlocked: {formatDate(badge.unlocked_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Award className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Unlock your first badge by signing up or finishing study timers.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Chart 4: Smart Goals Analytics */}
        <div className="clover-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-outfit font-bold text-base text-foreground mb-1">Smart Goals Analytics</h3>
            <p className="text-xs text-muted-foreground">Session completion & interruption reasons.</p>
          </div>

          <div className="mt-6 flex gap-4">
            <div className="bg-emerald-500/10 text-emerald-600 rounded-xl p-4 flex-1 text-center border border-emerald-500/20">
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 block">Completion Rate</span>
              <div className="font-outfit font-extrabold text-3xl">{sgCompletionRate}%</div>
            </div>
            <div className="bg-rose-500/10 text-rose-600 rounded-xl p-4 flex-1 text-center border border-rose-500/20">
              <span className="text-[10px] uppercase font-bold tracking-wider mb-1 block">Interrupted</span>
              <div className="font-outfit font-extrabold text-3xl">{sgInterrupted}</div>
            </div>
          </div>

          <div className="mt-6 flex-1">
            <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" /> Quit Reasons
            </h4>
            {Object.keys(sgReasonsCount).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(sgReasonsCount).map(([reason, count]) => {
                  const percentage = Math.round((count / sgInterrupted) * 100);
                  return (
                    <div key={reason}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-muted-foreground truncate pr-2">{reason}</span>
                        <span className="text-foreground shrink-0">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-rose-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Clover className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <span className="text-xs">No interruptions recorded yet.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MANUAL LOG TRIGGER DIALOG MODAL */}
      {showManualLog && (
        <Portal>
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 max-w-md w-full shadow-lg relative animate-float">
            
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <div className="p-2 bg-secondary text-primary rounded-md">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-lg text-foreground">Manual Attendance Input</h3>
                <p className="text-xs text-muted-foreground">Log custom attendance or override notes for specific days.</p>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Select Date</label>
                <DatePicker
                  value={manualDate}
                  onChange={(v) => setManualDate(v)}
                  placeholder="Pick a date"
                  maxDate="today"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Study Hours Logged</label>
                <input
                  type="number"
                  value={manualHours}
                  onChange={(e) => setManualHours(Number(e.target.value))}
                  min="0.1"
                  max="24"
                  step="0.1"
                  className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Study Notes</label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Studied Node.js middleware architecture and Express response handling."
                  rows="3"
                  className="w-full bg-background border border-input rounded-md p-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualLog(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-secondary text-secondary-foreground border border-input rounded-md hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Save Log
                </button>
              </div>
            </form>

          </div>
        </div>
        </Portal>
      )}

    </div>
  );
}

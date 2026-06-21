import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext, API_URL } from '../App';
import { 
  Play, CheckCircle2, ChevronRight, Code2, Loader2, Sparkles, 
  AlertCircle, RefreshCw, ArrowLeft, Lock, PlusCircle, FolderOpen, Award, Check
} from 'lucide-react';

export default function StudyTasksIDE() {
  const { token, showToast } = useContext(AuthContext);
  
  // Dashboard & IDE view modes
  const [mode, setMode] = useState('dashboard'); // 'dashboard' or 'ide'
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  
  // Topic inputs for generation
  const [subjectInput, setSubjectInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [generating, setGenerating] = useState(false);
  
  // IDE active state
  const [activeSubject, setActiveSubject] = useState('');
  const [activeTopic, setActiveTopic] = useState('');
  const [tasks, setTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [code, setCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [running, setRunning] = useState(false);

  // Fetch subjects and topics for dashboard
  useEffect(() => {
    if (token && mode === 'dashboard') {
      fetchSubjects();
    }
  }, [token, mode]);

  // Load starter/saved code when task changes
  useEffect(() => {
    if (tasks.length > 0 && tasks[currentTaskIndex]) {
      setCode(tasks[currentTaskIndex].userCode || tasks[currentTaskIndex].starterCode || '');
      setConsoleOutput([{ type: 'system', text: 'Ready. Write your code and click Run Tests.' }]);
    }
  }, [currentTaskIndex, tasks]);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const res = await fetch(`${API_URL}/study-ide/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Launch a selected topic
  const handleEnterTopic = async (subject, topic) => {
    setActiveSubject(subject);
    setActiveTopic(topic);
    try {
      const res = await fetch(`${API_URL}/study-ide/tasks?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to retrieve tasks');
      const data = await res.json();
      setTasks(data);
      
      // Focus on first uncompleted task
      const firstUncompleted = data.findIndex(t => !t.isCompleted);
      setCurrentTaskIndex(firstUncompleted !== -1 ? firstUncompleted : 0);
      
      setMode('ide');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Generate new tasks for subject & topic
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!subjectInput.trim() || !topicInput.trim()) {
      return showToast('Please enter both a Subject and a Topic', 'error');
    }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/study-ide/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subject: subjectInput.trim(), topic: topicInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Generation failed');
      
      setTasks(data.tasks);
      setActiveSubject(subjectInput.trim());
      setActiveTopic(topicInput.trim());
      setCurrentTaskIndex(0);
      setSubjectInput('');
      setTopicInput('');
      setMode('ide');
      showToast('10 tasks generated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Run tests and save code/completion
  const handleRunCode = async () => {
    if (!tasks[currentTaskIndex]) return;
    setRunning(true);
    setConsoleOutput([]); // clear console
    
    const logs = [];
    const originalConsoleLog = console.log;
    
    const mockConsole = {
      log: (...args) => {
        const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        logs.push({ type: 'log', text });
        originalConsoleLog(...args);
      },
      error: (...args) => {
        const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        logs.push({ type: 'error', text });
        console.error(...args);
      }
    };

    try {
      const testCode = tasks[currentTaskIndex].testCode;
      
      // Wrap code in custom IIFE
      const executionFn = new Function('console', `
        ${code}
        
        // --- Hidden Test Execution ---
        ${testCode}
      `);

      executionFn(mockConsole);
      
      // Test passed! Save to DB as completed
      logs.push({ type: 'success', text: '✅ All test cases passed!' });
      setConsoleOutput(logs);

      const res = await fetch(`${API_URL}/study-ide/tasks/${tasks[currentTaskIndex].id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_code: code })
      });

      if (res.ok) {
        const updatedTask = await res.json();
        // Update local tasks state
        const updatedTasks = tasks.map((t, idx) => 
          idx === currentTaskIndex ? { ...t, isCompleted: true, userCode: code } : t
        );
        setTasks(updatedTasks);
        showToast('Challenge completed successfully!', 'success');
      } else {
        throw new Error('Could not persist completion to server');
      }

    } catch (err) {
      // Save current draft code to DB so they don't lose progress
      fetch(`${API_URL}/study-ide/tasks/${tasks[currentTaskIndex].id}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_code: code })
      }).catch(console.error);

      // Also update local state so they don't lose typed code in memory
      const updatedTasks = tasks.map((t, idx) => 
        idx === currentTaskIndex ? { ...t, userCode: code } : t
      );
      setTasks(updatedTasks);

      logs.push({ type: 'error', text: `❌ Test Failed: ${err.message}` });
      setConsoleOutput(logs);
    } finally {
      setRunning(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Group subjects for dashboard view
  const groupedSubjects = subjects.reduce((acc, curr) => {
    if (!acc[curr.subject]) {
      acc[curr.subject] = [];
    }
    acc[curr.subject].push(curr);
    return acc;
  }, {});

  // IDE view progress metrics
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const ideProgressPct = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  if (mode === 'dashboard') {
    return (
      <div className="flex flex-col min-h-[calc(100vh-6rem)] space-y-6">
        
        {/* Banner Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm shrink-0">
          <div>
            <h2 className="font-outfit font-extrabold text-2xl text-foreground flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary" />
              AI Coding Playground
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Test your knowledge by generating interactive, progressive coding exercises.
            </p>
          </div>
        </div>

        {/* Grid Layout: Subjects List vs New Topic Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
          
          {/* Left Column: Subjects & Topics List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-outfit font-bold text-lg text-foreground flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Your Study Subjects
            </h3>
            
            {loadingSubjects ? (
              <div className="p-8 text-center text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                Loading your playground library...
              </div>
            ) : Object.keys(groupedSubjects).length === 0 ? (
              <div className="border border-dashed border-border p-8 rounded-2xl bg-card text-center text-muted-foreground">
                <Code2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-base font-semibold text-foreground">No subjects generated yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Use the generation form on the right to build your first subject (e.g. "Node.js") and topic ("express").
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedSubjects).map(([subjectName, topics]) => (
                  <div key={subjectName} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
                    <h4 className="font-outfit font-extrabold text-lg text-foreground border-b border-border pb-2">
                      {subjectName}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {topics.map(t => {
                        const progressPct = t.total_tasks > 0 ? (t.completed_tasks / t.total_tasks) * 100 : 0;
                        return (
                          <div key={t.topic} className="flex flex-col bg-secondary/35 border border-border/50 rounded-xl p-4 hover:border-border hover:bg-secondary/50 transition-all justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="font-bold text-foreground capitalize truncate text-sm">{t.topic}</h5>
                                <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                                  {t.completed_tasks} / {t.total_tasks} Solved
                                </span>
                              </div>
                              
                              <div className="w-full bg-secondary rounded-full h-1.5 mt-3 overflow-hidden">
                                <div 
                                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleEnterTopic(t.subject, t.topic)}
                              className="mt-4 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary-foreground font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 self-end w-full sm:w-auto"
                            >
                              Resume Challenge <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Generation Panel */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-outfit font-bold text-lg text-foreground flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                Generate New Tasks
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Enter a Subject and Specific Topic to let the AI build a progressive list of 10 challenges.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Subject Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Node.js, React, JavaScript" 
                  value={subjectInput}
                  onChange={e => setSubjectInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Topic / Core Area</label>
                <input 
                  type="text" 
                  placeholder="e.g. express, hooks, recursion" 
                  value={topicInput}
                  onChange={e => setTopicInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={generating}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-50 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate 10 Challenges
              </button>
            </form>
          </div>

        </div>

      </div>
    );
  }

  // IDE Mode rendering
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* IDE Header with Back Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMode('dashboard')}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all flex items-center justify-center"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{activeSubject}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground capitalize font-semibold">{activeTopic}</span>
            </div>
            <h2 className="font-outfit font-extrabold text-xl text-foreground flex items-center gap-2 mt-0.5">
              Coding Workspace
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground">{completedCount} / {tasks.length} Completed</span>
          <div className="w-24 bg-secondary rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${ideProgressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Main IDE area */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Panel: Tasks list with locking mechanism */}
        <div className="w-full lg:w-1/3 flex flex-col bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-outfit font-bold text-base text-foreground">Sequential Progression</h3>
            <p className="text-xs text-muted-foreground mt-1">Solve the current challenge to unlock the next level.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {tasks.map((task, idx) => {
              // Lock logic: first task is always unlocked. Others are unlocked if the preceding task is completed.
              const isUnlocked = idx === 0 || tasks[idx - 1].isCompleted;
              const isActive = currentTaskIndex === idx;
              
              return (
                <button
                  key={task.id || idx}
                  onClick={() => isUnlocked && setCurrentTaskIndex(idx)}
                  disabled={!isUnlocked}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                    isActive 
                      ? 'bg-primary/10 border-primary/20 shadow-sm' 
                      : 'hover:bg-secondary/40 border-transparent disabled:opacity-50 disabled:hover:bg-transparent'
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    task.isCompleted 
                      ? 'bg-emerald-500 text-white' 
                      : isUnlocked 
                        ? 'bg-secondary text-primary border border-primary/20 font-bold text-[10px]' 
                        : 'bg-secondary/60 text-muted-foreground/60'
                  }`}>
                    {task.isCompleted ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : !isUnlocked ? (
                      <Lock className="w-2.5 h-2.5" />
                    ) : (
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate flex items-center gap-1.5 ${
                      isActive ? 'text-primary' : 'text-foreground'
                    }`}>
                      {task.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Active workspace and editor */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          
          {/* Instruction Banner */}
          <div className="bg-card border border-border p-4 rounded-2xl shadow-sm shrink-0">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Challenge {currentTaskIndex + 1}</span>
            <h3 className="font-outfit font-bold text-lg text-foreground mt-1">{tasks[currentTaskIndex]?.title}</h3>
            <p className="text-sm text-foreground/80 mt-3 leading-relaxed whitespace-pre-line">
              {tasks[currentTaskIndex]?.description}
            </p>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col bg-[#1e1e1e] rounded-2xl shadow-sm border border-border overflow-hidden min-h-[300px]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#333] bg-[#252526]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                <span className="text-[#cccccc] text-xs ml-2 font-mono">solution.js</span>
              </div>
              <button 
                onClick={handleRunCode}
                disabled={running}
                className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Run Tests
              </button>
            </div>
            
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck="false"
              className="flex-1 w-full p-4 bg-transparent text-[#d4d4d4] font-mono text-sm leading-relaxed resize-none outline-none"
              style={{ tabSize: 2 }}
            />
          </div>

          {/* Output Console */}
          <div className="h-44 shrink-0 flex flex-col bg-[#0d0d0d] rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="px-4 py-2 border-b border-[#333] bg-[#1a1a1a] flex items-center justify-between">
              <span className="text-[#888888] text-xs font-bold uppercase tracking-wider">Output Console</span>
              {tasks[currentTaskIndex]?.isCompleted && currentTaskIndex < tasks.length - 1 && (
                <button 
                  onClick={() => setCurrentTaskIndex(currentTaskIndex + 1)}
                  className="flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-bold transition-colors"
                >
                  Next Task <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5">
              {consoleOutput.length === 0 ? (
                <span className="text-[#555]">Waiting for execution...</span>
              ) : (
                consoleOutput.map((log, i) => (
                  <div key={i} className={`
                    ${log.type === 'error' ? 'text-rose-400' : ''}
                    ${log.type === 'success' ? 'text-emerald-400 font-bold' : ''}
                    ${log.type === 'log' ? 'text-[#cccccc]' : ''}
                    ${log.type === 'system' ? 'text-[#888888] italic' : ''}
                  `}>
                    {log.text}
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

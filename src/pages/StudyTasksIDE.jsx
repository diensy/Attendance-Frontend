import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext, API_URL } from '../App';
import { Play, CheckCircle2, ChevronRight, Code2, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function StudyTasksIDE() {
  const { token, showToast } = useContext(AuthContext);
  
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [tasks, setTasks] = useState([]);
  
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [code, setCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);

  // Auto-load starter code when task changes
  useEffect(() => {
    if (tasks.length > 0 && tasks[currentTaskIndex]) {
      setCode(tasks[currentTaskIndex].starterCode || '');
      setConsoleOutput([{ type: 'system', text: 'Ready. Write your code and click Run.' }]);
    }
  }, [currentTaskIndex, tasks]);

  const handleGenerate = async () => {
    if (!topic.trim()) return showToast('Please enter a topic', 'error');
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/ai/generate-coding-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ topic, count: 10 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Generation failed');
      
      setTasks(data.tasks);
      setCurrentTaskIndex(0);
      setCompletedTasks([]);
      showToast('10 tasks generated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleRunCode = () => {
    if (!tasks[currentTaskIndex]) return;
    setRunning(true);
    setConsoleOutput([]); // clear console
    
    const logs = [];
    const originalConsoleLog = console.log;
    
    // We create a mock console to capture output
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
      // The user's code + the hidden test code
      const testCode = tasks[currentTaskIndex].testCode;
      
      // We wrap the execution in an IIFE passing our mock console
      const executionFn = new Function('console', `
        ${code}
        
        // --- Hidden Test Execution ---
        ${testCode}
      `);

      executionFn(mockConsole);
      
      // If we got here, no errors were thrown by the testCode!
      logs.push({ type: 'success', text: '✅ All test cases passed!' });
      setConsoleOutput(logs);
      
      if (!completedTasks.includes(currentTaskIndex)) {
        setCompletedTasks([...completedTasks, currentTaskIndex]);
      }

    } catch (err) {
      logs.push({ type: 'error', text: `❌ Test Failed: ${err.message}` });
      setConsoleOutput(logs);
    } finally {
      setRunning(false);
    }
  };

  const handleKeyDown = (e) => {
    // Basic tab support for textarea
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header & Topic Generator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm shrink-0">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-foreground flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary" />
            Interactive AI Study Tasks
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Generate dynamic coding challenges based on what you studied.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="e.g. Express.js, Middleware" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            className="flex-1 sm:w-64 bg-background border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button 
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate 10 Tasks
          </button>
        </div>
      </div>

      {/* Main IDE Area */}
      {tasks.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          
          {/* Left Panel: Tasks List */}
          <div className="w-full lg:w-1/3 flex flex-col bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-outfit font-bold text-base text-foreground">10 Study Challenges</h3>
              <p className="text-xs text-muted-foreground mt-1">{completedTasks.length} / 10 Completed</p>
              
              <div className="w-full bg-secondary rounded-full h-1.5 mt-3 overflow-hidden">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${(completedTasks.length / 10) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {tasks.map((task, idx) => {
                const isCompleted = completedTasks.includes(idx);
                const isActive = currentTaskIndex === idx;
                
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentTaskIndex(idx)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                      isActive 
                        ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                        : 'hover:bg-secondary border border-transparent'
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {task.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Code Editor & Console */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            
            {/* Instruction Banner */}
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Task {currentTaskIndex + 1}</span>
                  <h3 className="font-outfit font-bold text-lg text-foreground mt-1">{tasks[currentTaskIndex].title}</h3>
                </div>
              </div>
              <p className="text-sm text-foreground/80 mt-3 leading-relaxed">
                {tasks[currentTaskIndex].description}
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
                  <Play className="w-3.5 h-3.5" />
                  Run Tests
                </button>
              </div>
              
              {/* Simple Textarea serving as an editor */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck="false"
                className="flex-1 w-full p-4 bg-transparent text-[#d4d4d4] font-mono text-sm leading-relaxed resize-none outline-none"
                style={{ tabSize: 2 }}
              />
            </div>

            {/* Console Output Area */}
            <div className="h-48 shrink-0 flex flex-col bg-[#0d0d0d] rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="px-4 py-2 border-b border-[#333] bg-[#1a1a1a] flex items-center justify-between">
                <span className="text-[#888888] text-xs font-bold uppercase tracking-wider">Output Console</span>
                {completedTasks.includes(currentTaskIndex) && currentTaskIndex < tasks.length - 1 && (
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
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-card/50">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Code2 className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-outfit font-bold text-xl text-foreground">No Tasks Generated</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm text-center">
            Enter a topic like "Express.js" or "Middleware" above, and our AI will build 10 progressive coding challenges with automated test cases for you.
          </p>
        </div>
      )}
    </div>
  );
}

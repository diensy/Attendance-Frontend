import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext, API_URL } from '../App';
import Portal from '../components/Portal';
import { MessageSquare, Send, Settings, Check, User, Bot, Loader2, Sparkles, Target, CalendarDays, Calendar } from 'lucide-react';

const renderMarkdown = (text) => {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-black/20 dark:bg-white/20 px-1 py-0.5 rounded text-[0.9em]">$1</code>')
    .replace(/\n/g, '<br />');
  return <div dangerouslySetInnerHTML={{ __html: html }} className="whitespace-pre-wrap font-sans" />;
};

export default function Coach() {
  const { token, showToast } = useContext(AuthContext);

  // Chat State
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm Code Clover 🍀, your personalized AI Study Coach. How can I help you plan your learning today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Preferences State
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState({
    preferred_study_time: 'Night',
    daily_hours: 2.0,
    office_time_start: '10:00:00',
    office_time_end: '19:00:00',
    career_goal: 'Backend Developer'
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`${API_URL}/ai/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.preferred_study_time) setPrefs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    try {
      const res = await fetch(`${API_URL}/ai/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(prefs)
      });
      if (res.ok) {
        showToast('Preferences saved successfully! 🍀', 'success');
        setShowSettings(false);
      } else {
        showToast('Failed to save preferences', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server', 'error');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    // Add user message to UI
    const newMessages = [...messages, { role: 'user', content: messageText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/ai/coach/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: messageText })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: "⚠️ I'm sorry, I encountered an error while trying to process that." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: "⚠️ Connection error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionText) => {
    sendMessage(actionText);
  };

  const renderSettingsModal = () => {
    if (!showSettings) return null;
    return (
      <Portal>
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 max-w-md w-full shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <div className="p-2 bg-primary/10 text-primary rounded-md">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-lg text-foreground">Coach Preferences</h3>
                <p className="text-xs text-muted-foreground">Personalize your AI study coach.</p>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-outfit">Career Goal</label>
                <input
                  type="text"
                  required
                  value={prefs.career_goal}
                  onChange={(e) => setPrefs({...prefs, career_goal: e.target.value})}
                  className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-outfit">Study Time</label>
                  <select
                    value={prefs.preferred_study_time}
                    onChange={(e) => setPrefs({...prefs, preferred_study_time: e.target.value})}
                    className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-outfit">Daily Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={prefs.daily_hours}
                    onChange={(e) => setPrefs({...prefs, daily_hours: e.target.value})}
                    className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-outfit">Office Start</label>
                  <input
                    type="time"
                    required
                    value={prefs.office_time_start}
                    onChange={(e) => setPrefs({...prefs, office_time_start: e.target.value})}
                    className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-outfit">Office End</label>
                  <input
                    type="time"
                    required
                    value={prefs.office_time_end}
                    onChange={(e) => setPrefs({...prefs, office_time_end: e.target.value})}
                    className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-secondary text-secondary-foreground border border-input rounded-md hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPrefs}
                  className="flex-1 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  {isSavingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </Portal>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            AI Study Coach
          </h2>
          <p className="text-sm text-muted-foreground">Personalized scheduling and guidance tailored to your goals.</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground border border-border font-semibold rounded-xl text-sm hover:bg-muted transition-all"
        >
          <Settings className="w-4 h-4" />
          Preferences
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
        <button
          onClick={() => handleQuickAction("Plan my day based on my goals, pending tasks, and my office hours.")}
          className="flex items-center justify-center gap-2 p-3 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl font-bold transition-all text-sm group"
        >
          <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
          Plan My Day
        </button>
        <button
          onClick={() => handleQuickAction("Create a weekly study roadmap for me to make progress on my goals.")}
          className="flex items-center justify-center gap-2 p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl font-bold transition-all text-sm group"
        >
          <CalendarDays className="w-4 h-4 group-hover:animate-pulse" />
          Plan My Week
        </button>
        <button
          onClick={() => handleQuickAction("Create a high-level monthly strategy to reach my career goal.")}
          className="flex items-center justify-center gap-2 p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:border-rose-500/40 rounded-xl font-bold transition-all text-sm group"
        >
          <Target className="w-4 h-4 group-hover:animate-pulse" />
          Plan My Month
        </button>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg, idx) => {
            const isAI = msg.role === 'assistant';
            return (
              <div key={idx} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex max-w-[85%] gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isAI ? 'bg-primary/20 text-primary' : 'bg-secondary border border-border text-foreground'
                  }`}>
                    {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`px-4 py-3 rounded-2xl ${
                    isAI 
                      ? 'bg-secondary border border-border text-foreground prose prose-sm prose-invert max-w-none' 
                      : 'bg-primary text-primary-foreground font-medium'
                  }`}>
                    {isAI ? (
                      renderMarkdown(msg.content)
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[85%] gap-3 flex-row">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/20 text-primary">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-secondary border border-border flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground font-medium">Coach is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 bg-muted/30 border-t border-border">
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a schedule, ask a technical question, or request advice..."
              className="w-full bg-background border border-input rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {renderSettingsModal()}
    </div>
  );
}

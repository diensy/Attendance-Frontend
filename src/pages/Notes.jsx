import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API_URL } from '../App';
import { 
  BookOpen, Sparkles, AlertCircle, RefreshCw, Send, CheckCircle2, 
  Calendar, FileText, Bookmark, ClipboardList
} from 'lucide-react';

export default function Notes() {
  const { token, showToast } = useContext(AuthContext);

  const [notes, setNotes] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [emailing, setEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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

  const fetchHistory = async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/attendance/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const toggleTopic = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setLoading(true);
    setAiReport('');
    try {
      const res = await fetch(`${API_URL}/ai/analyze-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notes,
          topics: selectedTopics
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Analysis failed');

      setAiReport(data.reportMarkdown);
      showToast?.('AI analysis completed successfully!', 'success');
    } catch (err) {
      showToast?.('Error fetching AI analysis: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailInsights = async () => {
    if (!aiReport) return;
    setEmailing(true);
    setEmailSuccess('');
    try {
      const res = await fetch(`${API_URL}/ai/email-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notes,
          reportMarkdown: aiReport
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Emailing failed');
      const successMsg = data.devFallback ? 'Email simulated in terminal console! 📨' : 'Study insights successfully sent to your email! 📬';
      setEmailSuccess(successMsg);
      showToast?.(successMsg, 'success');
      setTimeout(() => setEmailSuccess(''), 4000);
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setEmailing(false);
    }
  };

  const topicsList = ['Node.js', 'Python', 'DSA', 'AI/Data Science'];

  return (
    <div className="space-y-8">
      
      {/* HEADER SECTION */}
      <div>
        <h2 className="font-outfit font-extrabold text-2xl text-foreground">Study Notes & AI Insights</h2>
        <p className="text-sm text-muted-foreground">Synthesize notes to extract learning insights and suggest optimization recommendations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: EDITOR */}
        <div className="lg:col-span-2 space-y-6">
          <div className="clover-card p-6">
            <h3 className="font-outfit font-bold text-base text-foreground mb-6">AI Study Analyzer</h3>
            
            <form onSubmit={handleAnalyze} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Primary Topics</label>
                <div className="flex flex-wrap gap-2">
                  {topicsList.map(topic => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <button
                        type="button"
                        key={topic}
                        onClick={() => toggleTopic(topic)}
                        className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Write Notes / Code issues / Summary</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Paste your code logs, study points, or error blocks here. E.g. Learned Express routing patterns and solved CORS connection warnings. Need to practice SQL table relations tomorrow."
                  rows="6"
                  className="w-full bg-background border border-input rounded-md p-4 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading || !notes.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/95 py-2.5 rounded-md font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing notes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Insight Report</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* AI REPORT RESULT */}
          {aiReport && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm hover-shine">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h4 className="font-outfit font-extrabold text-xs text-primary uppercase tracking-wider">Clover AI Mentor Insights</h4>
                </div>
                <button
                  onClick={handleEmailInsights}
                  disabled={emailing}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all disabled:opacity-50 shrink-0"
                >
                  {emailing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>Email Report</span>
                </button>
              </div>

              {emailSuccess && (
                <div className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-md p-2.5 mb-4 text-center">
                  {emailSuccess}
                </div>
              )}
              
              {/* Parse Markdown representation */}
              <div className="text-xs leading-relaxed text-foreground whitespace-pre-line space-y-4 font-semibold">
                {aiReport}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: HISTORY LIST */}
        <div className="clover-card p-6 flex flex-col">
          <div className="border-b border-border pb-4 mb-5">
            <h3 className="font-outfit font-bold text-base text-foreground">Past Notes History</h3>
            <p className="text-xs text-muted-foreground">Review log archive of study comments.</p>
          </div>

          {historyLoading ? (
            <div className="h-64 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1 flex-grow">
              {history.length > 0 ? (
                history.map(item => (
                  <div key={item.id} className="p-3.5 bg-muted/30 border border-border rounded-md space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatAttendanceDate(item.date)}
                      </span>
                      <span>{item.study_hours} hrs studied</span>
                    </div>
                    {item.daily_notes ? (
                      <p className="text-[11px] text-foreground leading-relaxed italic">
                        "{item.daily_notes}"
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">No notes written for this day.</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No notes history recorded.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

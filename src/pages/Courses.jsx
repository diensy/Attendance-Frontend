import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext, API_URL } from '../App';
import Portal from '../components/Portal';
import { 
  Play, CheckCircle, Circle, ArrowLeft, Plus, Trash2, 
  BookOpen, Sparkles, Send, Maximize2, Minimize2, 
  ExternalLink, Loader2, Award, Youtube
} from 'lucide-react';

export default function Courses() {
  const { token, showToast, stats, fetchStats } = useContext(AuthContext);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saving...', 'Saved', 'Unsaved'
  const [focusMode, setFocusMode] = useState(false);
  
  // Import Playlist State
  const [showImportModal, setShowImportModal] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSubject, setImportSubject] = useState('Node.js');
  const [selectedSubjectTab, setSelectedSubjectTab] = useState('All');

  // AI Summary State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');

  // YouTube Player Ref & State
  const playerRef = useRef(null);
  const playerPollerRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Fetch all courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCourses(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId, e) => {
    e.stopPropagation();
    if (!window.Swal) {
      if (!window.confirm('Are you sure you want to delete this course?')) return;
      // fallback
    }

    window.Swal.fire({
      title: 'Delete Classroom?',
      text: 'All study progress logs for this playlist will be removed from your profile.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#EF4444',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_URL}/courses/${courseId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            showToast('Classroom deleted successfully! 🗑️', 'success');
            fetchCourses();
            fetchStats();
          } else {
            const data = await res.json();
            showToast(data.message || 'Failed to delete course', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Error deleting course', 'error');
        }
      }
    });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch course details
  const loadCourse = async (courseId) => {
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCourse(data.course);
        setVideos(data.videos);

        // Find last watched or first video
        const firstUncompleted = data.videos.find(v => !v.is_completed);
        const videoToLoad = firstUncompleted || data.videos[0];
        if (videoToLoad) {
          selectVideo(videoToLoad);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectVideo = (video) => {
    setActiveVideo(video);
    setNotes(video.notes || '');
    setSaveStatus('Saved');
  };

  // Import YouTube Playlist
  const handleImport = async (e) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    setIsImporting(true);
    try {
      const res = await fetch(`${API_URL}/courses/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ playlistUrl, subject: importSubject })
      });
      const data = await res.json();
      if (res.ok) {
        window.Swal.fire({
          icon: 'success',
          title: 'Classroom Loaded! 🎥',
          text: 'Course syllabus tracks initialized successfully.',
          timer: 2000,
          showConfirmButton: false
        });
        setPlaylistUrl('');
        setShowImportModal(false);
        fetchCourses();
      } else {
        window.Swal.fire('Import Failed', data.message || 'Could not parse playlist metadata.', 'error');
      }
    } catch (err) {
      console.error(err);
      window.Swal.fire('Connection Error', 'Error connecting to backend server', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Auto-save notes functionality (saves notes when user types, debounced)
  useEffect(() => {
    if (!activeVideo) return;
    if (saveStatus !== 'Unsaved') return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('Saving...');
      try {
        const res = await fetch(`${API_URL}/courses/videos/${activeVideo.id}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            notes,
            watched_seconds: playerRef.current ? Math.round(playerRef.current.getCurrentTime()) : 0
          })
        });
        if (res.ok) {
          setSaveStatus('Saved');
          // Update local videos state notes field
          setVideos(prev => prev.map(v => v.id === activeVideo.id ? { ...v, notes } : v));
        } else {
          setSaveStatus('Error saving');
        }
      } catch (err) {
        setSaveStatus('Error saving');
      }
    }, 2000);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [notes, activeVideo, saveStatus]);

  // Load YouTube Player Script & Embed Player
  useEffect(() => {
    if (!activeVideo) return;

    // Load Youtube Iframe API script if not loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Function to initialize player
    const initPlayer = () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }

      playerRef.current = new window.YT.Player('youtube-player-frame', {
        height: '100%',
        width: '100%',
        videoId: activeVideo.video_id,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          showinfo: 0,
          ecver: 2
        },
        events: {
          onReady: (event) => {
            const startSec = activeVideo.start_seconds || 0;
            const watched = activeVideo.watched_seconds || 0;
            const duration = activeVideo.duration_seconds || 0;
            
            // Seek to previous watched seconds or start_seconds
            const seekPos = watched > 0 && watched < duration - 10 
              ? startSec + watched 
              : startSec;
              
            if (seekPos > 0) {
              event.target.seekTo(seekPos, true);
            }
          },
          onStateChange: (event) => {
            // YT.PlayerState.ENDED is 0
            if (event.data === window.YT.PlayerState.ENDED) {
              handleVideoComplete(true);
            }
          }
        }
      });

      // Clear previous interval if any
      if (playerPollerRef.current) clearInterval(playerPollerRef.current);
      
      // Periodically update watched seconds on backend (every 10 seconds)
      playerPollerRef.current = setInterval(async () => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const current = Math.round(playerRef.current.getCurrentTime());
          const startSec = activeVideo.start_seconds || 0;
          const duration = activeVideo.duration_seconds || 1;
          const relativeWatched = Math.min(duration, Math.max(0, current - startSec));
          if (relativeWatched > 0 && relativeWatched % 10 === 0) {
            try {
              await fetch(`${API_URL}/courses/videos/${activeVideo.id}/progress`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  watched_seconds: relativeWatched,
                  notes
                })
              });
            } catch (err) {
              console.error('Periodic progress sync failed:', err.message);
            }
          }
        }
      }, 10000);
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerPollerRef.current) clearInterval(playerPollerRef.current);
    };
  }, [activeVideo]);

  // Handle Video Completion
  const handleVideoComplete = async (isAutoEnd = false) => {
    if (!activeVideo || activeVideo.is_completed) return;

    // Check watch percentage to prevent early manual completions
    if (isAutoEnd !== true) {
      let currentWatched = activeVideo.watched_seconds || 0;
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const current = Math.round(playerRef.current.getCurrentTime());
          const startSec = activeVideo.start_seconds || 0;
          currentWatched = Math.max(currentWatched, Math.max(0, current - startSec));
        } catch (e) {}
      }

      const duration = activeVideo.duration_seconds || 1;
      const percentWatched = (currentWatched / duration) * 100;

      if (percentWatched < 90) {
        window.Swal.fire({
          icon: 'warning',
          title: 'Keep Studying! 📚',
          text: `You have only watched ${Math.round(percentWatched)}% of this video. You must watch at least 90% to mark it complete!`,
          confirmButtonColor: '#10B981',
        });
        return;
      }
    }

    try {
      const res = await fetch(`${API_URL}/courses/videos/${activeVideo.id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        window.Swal.fire({
          icon: 'success',
          title: 'Lesson Completed! 🏆',
          text: 'Study hours logged, streak updated, and goals synced.',
          timer: 2000,
          showConfirmButton: false
        });
        
        // Save and trigger AI summary Modal
        if (data.aiSummary) {
          setAiSummaryText(data.aiSummary);
          setShowAiModal(true);
        }

        // Refresh stats (streaks & productivity score)
        fetchStats();

        // Refresh course view locally
        setVideos(prev => prev.map(v => v.id === activeVideo.id ? { ...v, is_completed: true, completed_at: new Date() } : v));
        setActiveVideo(prev => ({ ...prev, is_completed: true }));
      }
    } catch (e) {
      console.error('Complete video route error:', e);
    }
  };

  // Toggle Focus Mode styling adjustments
  useEffect(() => {
    const root = document.querySelector('aside');
    const header = document.querySelector('header');
    if (!root || !header) return;

    if (focusMode) {
      root.style.display = 'none';
      header.style.display = 'none';
    } else {
      root.style.display = '';
      header.style.display = '';
    }

    return () => {
      root.style.display = '';
      header.style.display = '';
    };
  }, [focusMode]);

  return (
    <div className="space-y-6">
      {/* ── COURSE SELECTION VIEW ── */}
      {!activeCourse ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-outfit font-extrabold text-2xl text-foreground">Study Playlist Learning Center</h2>
              <p className="text-sm text-muted-foreground">Import public playlists to learn and log progress automatically with no distractions.</p>
            </div>
            <button
              onClick={() => {
                setImportSubject(selectedSubjectTab === 'All' ? 'Node.js' : selectedSubjectTab);
                setShowImportModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Import YouTube Course
            </button>
          </div>

          {/* Subject Pills/Tabs Filter */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border">
            {['All', 'Node.js', 'React', 'Python', 'DSA', 'AI/Data Science', 'General'].map((sub) => {
              const count = sub === 'All' ? courses.length : courses.filter(c => c.subject === sub).length;
              const isActive = selectedSubjectTab === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubjectTab(sub)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 border ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-muted-foreground hover:text-foreground border-border hover:bg-secondary'
                  }`}
                >
                  <span>{sub}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 bg-card rounded-2xl border border-border text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground font-semibold">Loading classrooms...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border text-center">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-4 animate-pulse">
                <Youtube className="w-12 h-12" />
              </div>
              <h3 className="font-outfit font-bold text-lg mb-1">No Courses Loaded Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Paste any developer course playlist from YouTube. Code Clover will parse and track all modules side-by-side.
              </p>
              <button
                onClick={() => {
                  setImportSubject('Node.js');
                  setShowImportModal(true);
                }}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all"
              >
                Import First Course
              </button>
            </div>
          ) : (() => {
            const filteredCourses = selectedSubjectTab === 'All'
              ? courses
              : courses.filter(c => c.subject === selectedSubjectTab);

            if (filteredCourses.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border text-center">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-4 animate-pulse">
                    <Youtube className="w-12 h-12" />
                  </div>
                  <h3 className="font-outfit font-bold text-lg mb-1">No Courses in {selectedSubjectTab}</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    You haven't imported any course under the "{selectedSubjectTab}" category yet.
                  </p>
                  <button
                    onClick={() => {
                      setImportSubject(selectedSubjectTab === 'All' ? 'Node.js' : selectedSubjectTab);
                      setShowImportModal(true);
                    }}
                    className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all"
                  >
                    Import {selectedSubjectTab} Course
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => {
                  const percent = Math.round((course.completed_videos / course.total_videos) * 100) || 0;
                  return (
                    <div 
                      key={course.id} 
                      className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
                    >
                      <div className="relative w-full aspect-video bg-muted overflow-hidden shrink-0">
                        <img 
                          src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500'} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={(e) => handleDeleteCourse(course.id, e)}
                          className="absolute top-2 left-2 p-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/60 rounded-lg text-[10px] text-white font-bold backdrop-blur-sm z-10">
                          {course.total_videos} Videos
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary/95 text-primary-foreground text-[10px] font-bold rounded-lg backdrop-blur-sm z-10">
                          {course.subject || 'General'}
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h4 className="font-outfit font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {course.title || 'Untitled Playlist'}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {course.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                            <span>Progress: {course.completed_videos} / {course.total_videos} Completed</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => loadCourse(course.id)}
                          className="w-full py-2 bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Enter Classroom
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        /* ── CLASSROOM (PLAYER & NOTES) VIEW ── */
        <div className="space-y-4 relative">
          
          {/* Header Row */}
          {!focusMode && (
            <div className="flex items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setActiveCourse(null); setActiveVideo(null); setVideos([]); }}
                  className="p-2 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="font-outfit font-bold text-lg text-foreground truncate max-w-md">{activeCourse.title}</h3>
                  <p className="text-xs text-muted-foreground">Playlist Classroom Mode</p>
                </div>
              </div>
              
              <button
                onClick={() => setFocusMode(true)}
                className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-xl text-xs font-bold hover:bg-orange-500/20 transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Focus Mode 🧘
              </button>
            </div>
          )}

          {/* Focus Mode floating escape header */}
          {focusMode && (
            <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between bg-black/80 backdrop-blur-md text-white p-3.5 rounded-xl border border-white/10 shadow-xl">
              <span className="font-outfit font-extrabold text-sm text-primary tracking-wide">🍀 Code Clover Focus Mode</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-semibold truncate max-w-xs">{activeVideo?.title}</span>
                <button
                  onClick={() => setFocusMode(false)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all text-white"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  Exit Focus Mode
                </button>
              </div>
            </div>
          )}

          {/* Main Interface Grid */}
          <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${focusMode ? 'pt-16 min-h-[calc(100vh-6rem)]' : ''}`}>
            
            {/* Playlist Sidebar Episodes */}
            <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-4 flex flex-col h-[600px]">
              <h4 className="font-outfit font-bold text-sm text-foreground border-b border-border pb-2.5 mb-3">
                Course Syllabus ({videos.filter(v => v.is_completed).length}/{videos.length})
              </h4>
              <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                {videos.map((vid) => {
                  const isActive = activeVideo?.id === vid.id;
                  return (
                    <button
                      key={vid.id}
                      onClick={() => selectVideo(vid)}
                      className={`flex items-start gap-3 w-full p-2.5 rounded-xl text-left text-xs transition-all ${
                        isActive 
                          ? 'bg-primary/10 border-l-4 border-primary text-primary font-bold' 
                          : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {vid.is_completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                        ) : isActive ? (
                          <Play className="w-4 h-4 text-primary fill-primary/20 animate-pulse" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`line-clamp-2 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {vid.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Duration: {Math.round(vid.duration_seconds / 60)} mins
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video player + Notes Workspace */}
            <div className="lg:col-span-3 flex flex-col space-y-4">
              
              {/* Player and Notes side-by-side row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Embedded Video frame */}
                <div className="md:col-span-2 flex flex-col bg-black rounded-2xl overflow-hidden aspect-video border border-border shadow-md relative">
                  <div id="youtube-player-frame" className="w-full h-full" />
                </div>

                {/* Notes taking side-panel */}
                <div className="md:col-span-1 bg-card border border-border rounded-2xl p-4 flex flex-col h-full min-h-[300px]">
                  <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <h4 className="font-outfit font-bold text-sm text-foreground">Lecture Notes</h4>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      saveStatus === 'Saving...' 
                        ? 'bg-amber-500/10 text-amber-500' 
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {saveStatus}
                    </span>
                  </div>

                  <textarea
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); setSaveStatus('Unsaved'); }}
                    placeholder="Jot down notes while watching... Auto-saves every few seconds."
                    className="flex-1 w-full bg-secondary border border-input rounded-xl p-3 text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Player action & AI Summaries Card */}
              <div className="bg-card border border-border p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h4 className="font-outfit font-bold text-sm text-foreground">{activeVideo?.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Status: {activeVideo?.is_completed ? 'Completed ✅' : 'In Progress 🔄'} • Length: {Math.round(activeVideo?.duration_seconds / 60)} mins
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {!activeVideo?.is_completed && (
                    <button
                      onClick={handleVideoComplete}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Complete
                    </button>
                  )}
                  {activeVideo?.is_completed && (
                    <button
                      onClick={async () => {
                        // Re-fetch review text if completed
                        const res = await fetch(`${API_URL}/courses/${activeCourse.id}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok) {
                          const data = await res.json();
                          const currentVid = data.videos.find(v => v.id === activeVideo.id);
                          if (currentVid) {
                            // Find relevant summary block in attendance AI summary or fetch fallback
                            setAiSummaryText(`### AI Review Summary\n\nNotes loaded successfully.`);
                            setShowAiModal(true);
                          }
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-primary font-bold rounded-xl text-xs hover:bg-primary/10 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Review Summary
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── IMPORT PLAYLIST MODAL ── */}
      {showImportModal && (
        <Portal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-card text-card-foreground border border-border rounded-xl p-6 max-w-md w-full shadow-lg relative animate-float">
              
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
                <div className="p-2 bg-secondary text-primary rounded-md">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-lg text-foreground">Import YouTube Playlist</h3>
                  <p className="text-xs text-muted-foreground">Paste the link and select subject category to parse curriculum modules.</p>
                </div>
              </div>

              <form onSubmit={handleImport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-outfit">Subject Category</label>
                  <select
                    value={importSubject}
                    onChange={(e) => setImportSubject(e.target.value)}
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

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-outfit">Playlist URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/playlist?list=PL..."
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 py-2 text-xs font-semibold bg-secondary text-secondary-foreground border border-input rounded-md hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isImporting}
                    className="flex-1 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wider font-bold"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin animate-duration-1000" />
                        Parsing...
                      </>
                    ) : (
                      'Import Course'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ── AI SUMMARY MODAL ── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center gap-3 border-b border-border pb-3 mb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-outfit font-extrabold text-base text-foreground">AI Concept Review 🍀</h3>
                <p className="text-[11px] text-muted-foreground">Auto-generated smart concepts and study highlights</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-foreground leading-relaxed">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{aiSummaryText}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <button
                onClick={() => setShowAiModal(false)}
                className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-md"
              >
                Close &amp; Continue Study
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

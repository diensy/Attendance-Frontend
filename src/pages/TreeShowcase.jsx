import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import CloverTree from '../components/CloverTree';
import { Flame, Award, Timer, BookOpen, ArrowLeft, Sparkles, TrendingUp } from 'lucide-react';

export default function TreeShowcase() {
  const { stats } = useContext(AuthContext);
  const navigate = useNavigate();

  const xp = stats?.xpPoints || 0;
  const streak = stats?.streak || 0;
  const badgeCount = stats?.badges?.length || 1;

  // Determine stage info matching CloverTree's logic
  const stages = [
    { min: 0,   max: 49,  label: 'Seed',         next: 50,  emoji: '🌱', color: '#a3a3a3', desc: 'Just planted. Your journey begins.' },
    { min: 50,  max: 149, label: 'Sprout',        next: 150, emoji: '🌿', color: '#84cc16', desc: 'A tiny sprout emerges. Keep studying!' },
    { min: 150, max: 299, label: 'Sapling',       next: 300, emoji: '🍃', color: '#22c55e', desc: 'Growing strong. You\'re building habits.' },
    { min: 300, max: 599, label: 'Young Clover',  next: 600, emoji: '🍀', color: '#16a34a', desc: 'A real clover taking shape. Impressive!' },
    { min: 600, max: Infinity, label: 'Full Clover Tree', next: null, emoji: '🌳', color: '#15803d', desc: 'A magnificent Clover Tree! You\'re a master.' },
  ];

  const currentStage = [...stages].reverse().find(s => xp >= s.min) || stages[0];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2 uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
          <h2 className="font-outfit font-extrabold text-3xl text-foreground flex items-center gap-2">
            Your Clover Garden <span className="animate-bounce">🍀</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Nurture your organic Clover Tree by learning and maintaining your daily streak.
          </p>
        </div>

        {/* Stats Summary Panel */}
        <div className="flex gap-3 shrink-0">
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Flame className="w-5 h-5 fill-orange-500 text-orange-500 animate-pulse" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-orange-600/70 dark:text-orange-400/70">Streak</p>
              <p className="text-sm font-extrabold">{streak} Days</p>
            </div>
          </div>
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Award className="w-5 h-5" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-primary/70">Badges</p>
              <p className="text-sm font-extrabold">{badgeCount} Earned</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Tree Display Card */}
        <div className="md:col-span-7 clover-card p-8 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-card to-card/50">
          {/* Subtle background glow */}
          <div 
            className="absolute -top-24 w-80 h-80 rounded-full blur-3xl opacity-20 transition-all duration-1000"
            style={{ background: currentStage.color }}
          />

          <div className="w-full max-w-sm relative z-10">
            <CloverTree xp={xp} />
          </div>
        </div>

        {/* Info & Action Cards */}
        <div className="md:col-span-5 space-y-6">
          {/* Garden Progress */}
          <div className="clover-card p-6 space-y-4">
            <h3 className="font-outfit font-bold text-lg text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Garden Log
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your tree is currently in the <strong className="text-foreground">{currentStage.label}</strong> stage. 
              Keep studying and building consistent habits to watch it blossom into a magnificent Full Clover Tree!
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Current Level</span>
                <span className="font-bold text-foreground">{currentStage.emoji} {currentStage.label}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Total XP Earned</span>
                <span className="font-bold text-foreground">{xp} XP</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-1">
                <span className="text-muted-foreground">Status</span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-spin" /> Healthy &amp; Growing
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="clover-card p-6 space-y-4">
            <div>
              <h3 className="font-outfit font-bold text-lg text-foreground">Water Your Tree</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Earn XP to water and grow your clover tree right now.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/timer')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border hover:border-primary/30 bg-secondary/50 hover:bg-secondary transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground">Start Focus Timer</p>
                    <p className="text-[10px] text-muted-foreground">Study session: +10 XP</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Go &rarr;</span>
              </button>

              <button
                onClick={() => navigate('/courses')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border hover:border-primary/30 bg-secondary/50 hover:bg-secondary transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground">Play Video Classes</p>
                    <p className="text-[10px] text-muted-foreground">Watch courses: +2 XP</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Go &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

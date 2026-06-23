import React from 'react';

export default function CloverTree({ xp }) {
  const stages = [
    { min: 0,   max: 49,  label: 'Seed',         next: 50,  emoji: '🌱', color: '#a3a3a3', desc: 'Just planted. Nurture your seed with consistent learning.' },
    { min: 50,  max: 149, label: 'Sprout',        next: 150, emoji: '🌿', color: '#84cc16', desc: 'A fresh green shoot emerges. Keep reading and studying!' },
    { min: 150, max: 299, label: 'Sapling',       next: 300, emoji: '🍃', color: '#22c55e', desc: 'A young sapling with growing stems. Your habits are taking root.' },
    { min: 300, max: 599, label: 'Young Clover',  next: 600, emoji: '🍀', color: '#16a34a', desc: 'Lush leaves forming a beautiful canopy. A rare four-leaf clover has appeared!' },
    { min: 600, max: Infinity, label: 'Full Clover Tree', next: null, emoji: '🌳', color: '#15803d', desc: 'A legendary Clover Tree in full bloom, glowing with wisdom and daily dedication.' },
  ];

  const currentStage = [...stages].reverse().find(s => xp >= s.min) || stages[0];
  const stageIdx = stages.findIndex(s => s.label === currentStage.label);
  const progressToNext = currentStage.next
    ? Math.min(100, ((xp - currentStage.min) / (currentStage.next - currentStage.min)) * 100)
    : 100;

  return (
    <div className="w-full">
      {/* Tree SVG Illustration Container */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="relative">
          {/* Blur background aura */}
          <div 
            className="absolute inset-0 rounded-full blur-3xl opacity-20 dark:opacity-30 transition-all duration-1000"
            style={{ background: currentStage.color, transform: 'scale(1.4)' }}
          />
          
          {/* Premium Vector SVG */}
          <svg width="240" height="240" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-2xl">
            <defs>
              {/* Bark / Wood Gradients */}
              <linearGradient id="barkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3d1d04" />
                <stop offset="25%" stopColor="#5c310c" />
                <stop offset="50%" stopColor="#784115" />
                <stop offset="75%" stopColor="#5c310c" />
                <stop offset="100%" stopColor="#3d1d04" />
              </linearGradient>
              <linearGradient id="barkBranchGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#784115" />
                <stop offset="100%" stopColor="#8d5020" />
              </linearGradient>
              <linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#331c0e" />
                <stop offset="50%" stopColor="#221208" />
                <stop offset="100%" stopColor="#140a04" />
              </linearGradient>
              <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3e3f42" />
                <stop offset="50%" stopColor="#262729" />
                <stop offset="100%" stopColor="#151617" />
              </linearGradient>
              <linearGradient id="potRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#525458" />
                <stop offset="50%" stopColor="#3a3b3e" />
                <stop offset="100%" stopColor="#262729" />
              </linearGradient>

              {/* Foliage / Leaf Gradients */}
              <linearGradient id="leafGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a3e635" />
                <stop offset="100%" stopColor="#4d7c0f" />
              </linearGradient>
              <linearGradient id="leafGradMedium" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="50%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
              <linearGradient id="leafGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="60%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#062e14" />
              </linearGradient>
              <linearGradient id="goldLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>

              {/* Magical Glow Radial Gradients */}
              <radialGradient id="cloverGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.85" />
                <stop offset="40%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#eab308" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
              </radialGradient>

              {/* Reusable Clover Leaflet (Single detailed heart shape) */}
              <g id="clover-leaflet">
                {/* Heart Leaf Shape */}
                <path 
                  d="M0,0 C-12,-16 -18,-5 -12,9 C-8,18 -3,22 0,25 C3,22 8,18 12,9 C18,-5 12,-16 0,0 Z" 
                  fill="url(#leafGradMedium)" 
                />
                {/* Leaf Texture Details */}
                <line x1="0" y1="23" x2="0" y2="3" stroke="#bbf7d0" strokeWidth="0.8" opacity="0.65" />
                <path d="M0,17 Q-4,14 -8,12" stroke="#bbf7d0" strokeWidth="0.5" opacity="0.35" fill="none" />
                <path d="M0,17 Q4,14 8,12" stroke="#bbf7d0" strokeWidth="0.5" opacity="0.35" fill="none" />
                <path d="M0,12 Q-3,10 -6,8" stroke="#bbf7d0" strokeWidth="0.5" opacity="0.35" fill="none" />
                <path d="M0,12 Q3,10 6,8" stroke="#bbf7d0" strokeWidth="0.5" opacity="0.35" fill="none" />
              </g>

              {/* Golden Clover Leaflet (for legendary stages) */}
              <g id="clover-leaflet-gold">
                <path 
                  d="M0,0 C-12,-16 -18,-5 -12,9 C-8,18 -3,22 0,25 C3,22 8,18 12,9 C18,-5 12,-16 0,0 Z" 
                  fill="url(#goldLeafGrad)" 
                />
                <line x1="0" y1="23" x2="0" y2="3" stroke="#fef08a" strokeWidth="0.8" opacity="0.8" />
                <path d="M0,17 Q-4,14 -8,12" stroke="#fef08a" strokeWidth="0.5" opacity="0.5" fill="none" />
                <path d="M0,17 Q4,14 8,12" stroke="#fef08a" strokeWidth="0.5" opacity="0.5" fill="none" />
              </g>

              {/* Standard 3-Leaf Clover Group */}
              <g id="clover-3">
                <path d="M0,25 Q-3,44 -8,50" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <use href="#clover-leaflet" transform="translate(0, -25) rotate(0) scale(0.95)" />
                <use href="#clover-leaflet" transform="translate(0, -25) rotate(120) scale(0.95)" />
                <use href="#clover-leaflet" transform="translate(0, -25) rotate(-120) scale(0.95)" />
                <circle cx="0" cy="-25" r="2" fill="#86efac" opacity="0.9" />
              </g>

              {/* Glowing 4-Leaf Clover Group (High XP / Lucky) */}
              <g id="clover-4">
                <circle cx="0" cy="-25" r="32" fill="url(#cloverGlow)" />
                <path d="M0,25 Q-2,44 -6,52" stroke="#15803d" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                <use href="#clover-leaflet" transform="translate(0, -25) rotate(0) scale(1.05)" />
                <use href="#clover-leaflet" transform="translate(0, -25) rotate(90) scale(1.05)" />
                <use href="#clover-leaflet" transform="translate(0, -25) rotate(180) scale(1.05)" />
                <use href="#clover-leaflet" transform="translate(0, -25) rotate(270) scale(1.05)" />
                <circle cx="0" cy="-25" r="3.5" fill="#fef08a" style={{ filter: 'drop-shadow(0 0 3px #facc15)' }} />
              </g>

              {/* Legendary Golden 4-Leaf Clover */}
              <g id="clover-4-gold">
                <circle cx="0" cy="-25" r="36" fill="url(#goldGlow)" />
                <path d="M0,25 Q-1,44 -4,52" stroke="#ca8a04" strokeWidth="3" strokeLinecap="round" fill="none" />
                <use href="#clover-leaflet-gold" transform="translate(0, -25) rotate(0) scale(1.1)" />
                <use href="#clover-leaflet-gold" transform="translate(0, -25) rotate(90) scale(1.1)" />
                <use href="#clover-leaflet-gold" transform="translate(0, -25) rotate(180) scale(1.1)" />
                <use href="#clover-leaflet-gold" transform="translate(0, -25) rotate(270) scale(1.1)" />
                <circle cx="0" cy="-25" r="4" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px #ffffff)' }} />
              </g>

              {/* Sparkle Asset */}
              <g id="magic-sparkle">
                <path d="M0,-8 L2,-2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,-2 Z" fill="#fef08a" />
              </g>
            </defs>

            {/* Live Animation Styles */}
            <style>{`
              .sway-slow {
                transform-origin: 100px 200px;
                animation: gentleSway 7s ease-in-out infinite alternate;
              }
              .sway-medium {
                transform-origin: 100px 170px;
                animation: gentleSway 5s ease-in-out infinite alternate;
              }
              .sway-fast {
                transform-origin: 100px 180px;
                animation: gentleSway 3.5s ease-in-out infinite alternate;
              }
              .float-spore-1 {
                animation: floatUpSpore 8s linear infinite;
              }
              .float-spore-2 {
                animation: floatUpSpore 6s linear infinite 1.5s;
              }
              .float-spore-3 {
                animation: floatUpSpore 9s linear infinite 3.5s;
              }
              .float-spore-4 {
                animation: floatUpSpore 7s linear infinite 5s;
              }
              .pulse-magic {
                animation: magicPulse 2.5s ease-in-out infinite;
              }
              .leaf-shiver-slow {
                animation: shiver 12s ease-in-out infinite;
              }
              @keyframes gentleSway {
                0% { transform: rotate(-2.5deg) skewX(-0.5deg); }
                100% { transform: rotate(2.5deg) skewX(0.5deg); }
              }
              @keyframes floatUpSpore {
                0% { transform: translateY(0) translateX(0) scale(0.4); opacity: 0; }
                15% { opacity: 0.8; }
                85% { opacity: 0.5; }
                100% { transform: translateY(-90px) translateX(20px) scale(0); opacity: 0; }
              }
              @keyframes magicPulse {
                0%, 100% { opacity: 0.4; transform: scale(0.9); }
                50% { opacity: 1; transform: scale(1.15); }
              }
              @keyframes shiver {
                0%, 100% { transform: rotate(0deg); }
                30% { transform: rotate(1deg); }
                60% { transform: rotate(-1deg); }
                80% { transform: rotate(0.5deg); }
              }
            `}</style>

            {/* ── Pot & Foundation Soil ── */}
            <g id="pot-and-soil">
              {/* Shadow under the pot */}
              <ellipse cx="100" cy="214" rx="42" ry="5" fill="#000" opacity="0.25" />
              
              {/* Premium flower pot body */}
              <path d="M 70 190 L 73 210 Q 75 213, 79 213 L 121 213 Q 125 213, 127 210 L 130 190 Z" fill="url(#potGrad)" />
              {/* Rim of pot */}
              <rect x="66" y="184" width="68" height="6" rx="2" fill="url(#potRimGrad)" />
              {/* Highlights on rim/pot */}
              <line x1="68" y1="185" x2="132" y2="185" stroke="#ffffff" strokeWidth="0.5" opacity="0.15" />
              
              {/* Soil mound */}
              <ellipse cx="100" cy="184" rx="31" ry="5" fill="url(#soilGrad)" />
              {/* Grassy moss covering soil */}
              <path d="M 70 184 Q 85 180, 100 182 Q 115 180, 130 184 Q 100 189, 70 184 Z" fill="#14532d" />
              
              {/* Small details on soil: pebbles */}
              <ellipse cx="88" cy="185" rx="2" ry="1" fill="#4b5563" />
              <ellipse cx="112" cy="186" rx="1.5" ry="0.8" fill="#6b7280" />
            </g>

            {/* ── STAGE 0: SEED (0 - 49 XP) ── */}
            {stageIdx === 0 && (
              <g>
                {/* Glowing ring centered around seed */}
                <circle cx="100" cy="178" r="16" fill="url(#cloverGlow)" className="pulse-magic" />
                
                {/* Cracked soil lines where shoot is breaking out */}
                <path d="M 94 182 Q 100 178, 106 182" stroke="#1c0d05" strokeWidth="2.5" fill="none" />
                
                {/* Highly realistic golden seed shell */}
                <path 
                  d="M 95 180 C 93 176, 96 170, 101 170 C 106 170, 108 175, 106 179 C 104 182, 97 183, 95 180 Z" 
                  fill="url(#goldLeafGrad)" 
                  stroke="#854d0e" 
                  strokeWidth="1.2" 
                />
                {/* Seed highlight */}
                <path d="M 97 178 C 98 175, 100 174, 102 176" stroke="#ffffff" strokeWidth="0.6" fill="none" opacity="0.6" />
                
                {/* Micro root finding path into soil */}
                <path d="M 103 180 Q 106 185, 105 189" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                
                {/* Tender young sprout breaking ground */}
                <path d="M 99 171 Q 97 160, 102 154" stroke="url(#leafGradLight)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                
                {/* Unfolding twin baby leaves */}
                <path d="M 102 154 C 100 152, 95 154, 95 156" stroke="url(#leafGradLight)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                <path d="M 102 154 C 104 152, 109 154, 109 156" stroke="url(#leafGradLight)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                
                {/* Dewdrop on leaf */}
                <circle cx="102" cy="153" r="1.2" fill="#ffffff" opacity="0.85" />
              </g>
            )}

            {/* ── STAGE 1: SPROUT (50 - 149 XP) ── */}
            {stageIdx === 1 && (
              <g className="sway-fast">
                {/* Soft glow behind leaves */}
                <circle cx="100" cy="130" r="28" fill="url(#cloverGlow)" opacity="0.4" />

                {/* Main tender organic curved stem */}
                <path d="M 100 182 Q 95 145, 102 120" stroke="url(#leafGradLight)" strokeWidth="4.8" strokeLinecap="round" fill="none" />
                {/* Shading/vein inside stem */}
                <path d="M 100 182 Q 95 145, 102 120" stroke="#15803d" strokeWidth="0.8" opacity="0.3" fill="none" />
                
                {/* Branching leaf stems */}
                <path d="M 97 150 Q 82 142, 80 138" stroke="url(#leafGradLight)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                <path d="M 99 135 Q 115 128, 120 124" stroke="url(#leafGradLight)" strokeWidth="2.8" strokeLinecap="round" fill="none" />

                {/* 3 Detailed Sprout Leaves */}
                <use href="#clover-leaflet" transform="translate(80, 138) rotate(-45) scale(0.85)" />
                <use href="#clover-leaflet" transform="translate(120, 124) rotate(45) scale(0.85)" />
                <use href="#clover-leaflet" transform="translate(102, 120) rotate(5) scale(0.75)" />
                
                {/* Small new growth node breaking out */}
                <path d="M 98 160 Q 103 158, 104 153" stroke="url(#leafGradLight)" strokeWidth="2" strokeLinecap="round" fill="none" />
                <use href="#clover-leaflet" transform="translate(104, 153) rotate(30) scale(0.45)" />
              </g>
            )}

            {/* ── STAGE 2: SAPLING (150 - 299 XP) ── */}
            {stageIdx === 2 && (
              <g className="sway-medium">
                {/* Background Shadow Canopy */}
                <circle cx="100" cy="100" r="32" fill="#14532d" opacity="0.15" />

                {/* Detailed organic wood-textured trunk */}
                <path d="M 93 183 C 94 155, 95 130, 96 108 L 104 108 C 105 130, 106 155, 107 183 Z" fill="url(#barkGrad)" />
                {/* Bark details, highlights, and growth rings */}
                <path d="M 96 170 Q 98 135, 98 115" stroke="#2c1503" strokeWidth="1.2" opacity="0.65" fill="none" />
                <path d="M 101 180 Q 102 145, 101 120" stroke="#2c1503" strokeWidth="1.2" opacity="0.65" fill="none" />
                <path d="M 104 175 Q 104 150, 103 130" stroke="#92400e" strokeWidth="0.8" opacity="0.35" fill="none" />

                {/* Roots flaring out into the soil */}
                <path d="M 93 183 Q 86 186, 82 188" stroke="url(#barkGrad)" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M 107 183 Q 114 186, 118 188" stroke="url(#barkGrad)" strokeWidth="4.5" strokeLinecap="round" />

                {/* Woody splits / branch structure */}
                <path d="M 96 135 Q 80 120, 72 114" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="4" strokeLinecap="round" />
                <path d="M 104 125 Q 120 110, 128 104" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="3.8" strokeLinecap="round" />
                <path d="M 100 108 Q 98 90, 100 82" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="3" strokeLinecap="round" />

                {/* Clover clusters attached to branches */}
                <use href="#clover-3" x="69" y="112" transform="scale(0.8) rotate(-30)" />
                <use href="#clover-3" x="131" y="101" transform="scale(0.8) rotate(30)" />
                <use href="#clover-3" x="100" y="80" transform="scale(0.9) rotate(5)" />
              </g>
            )}

            {/* ── STAGE 3: YOUNG CLOVER (300 - 599 XP) ── */}
            {stageIdx === 3 && (
              <g className="sway-slow">
                {/* Floating active magical spores */}
                <circle cx="75" cy="115" r="2.5" fill="#facc15" className="float-spore-1" style={{ filter: 'drop-shadow(0 0 2px #facc15)' }} />
                <circle cx="125" cy="95" r="3" fill="#6ee7b7" className="float-spore-2" style={{ filter: 'drop-shadow(0 0 3px #10b981)' }} />
                <circle cx="95" cy="70" r="2" fill="#facc15" className="float-spore-3" style={{ filter: 'drop-shadow(0 0 2px #facc15)' }} />

                {/* Lush leafy background depth */}
                <circle cx="100" cy="75" r="45" fill="url(#cloverGlow)" opacity="0.6" />
                <circle cx="65" cy="100" r="25" fill="#14532d" opacity="0.25" />
                <circle cx="135" cy="90" r="25" fill="#14532d" opacity="0.25" />
                
                {/* Stronger, organically curved trunk */}
                <path d="M 91 183 C 93 150, 93 125, 95 102 L 105 102 C 107 125, 107 150, 109 183 Z" fill="url(#barkGrad)" />
                {/* Highlight/shadow lines on trunk */}
                <path d="M 94 170 Q 96 135, 97 108" stroke="#1f0a01" strokeWidth="1.5" opacity="0.75" fill="none" />
                <path d="M 100 180 Q 102 145, 101 110" stroke="#1f0a01" strokeWidth="1.5" opacity="0.75" fill="none" />
                <path d="M 105 172 Q 104 138, 103 115" stroke="#b45309" strokeWidth="0.8" opacity="0.3" fill="none" />

                {/* Gripping roots */}
                <path d="M 91 183 Q 82 186, 76 190" stroke="url(#barkGrad)" strokeWidth="6" strokeLinecap="round" />
                <path d="M 109 183 Q 118 186, 124 190" stroke="url(#barkGrad)" strokeWidth="6" strokeLinecap="round" />

                {/* Dynamic branches */}
                <path d="M 95 132 Q 74 112, 60 102" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 105 125 Q 126 104, 138 94" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="5" strokeLinecap="round" />
                <path d="M 97 102 Q 81 85, 76 78" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="3.8" strokeLinecap="round" />
                <path d="M 103 102 Q 119 85, 124 77" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="3.8" strokeLinecap="round" />
                <path d="M 100 102 Q 99 76, 100 68" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="3" strokeLinecap="round" />

                {/* Overlapping Clover Foliage */}
                <use href="#clover-3" x="58" y="99" transform="scale(0.85) rotate(-45)" />
                <use href="#clover-3" x="141" y="91" transform="scale(0.85) rotate(45)" />
                <use href="#clover-3" x="74" y="75" transform="scale(0.8) rotate(-15)" />
                <use href="#clover-3" x="126" y="74" transform="scale(0.8) rotate(15)" />
                <use href="#clover-3" x="100" y="65" transform="scale(0.9) rotate(0)" />

                {/* One lucky glowing four-leaf clover nestled in center */}
                <use href="#clover-4" x="100" y="98" transform="scale(0.72) rotate(15)" />
              </g>
            )}

            {/* ── STAGE 4: FULL CLOVER TREE (600+ XP) ── */}
            {stageIdx === 4 && (
              <g className="sway-slow">
                {/* Floating particle spores of different colors */}
                <circle cx="65" cy="110" r="3" fill="#fde047" className="float-spore-1" style={{ filter: 'drop-shadow(0 0 3px #facc15)' }} />
                <circle cx="135" cy="85" r="3.5" fill="#a7f3d0" className="float-spore-2" style={{ filter: 'drop-shadow(0 0 3px #10b981)' }} />
                <circle cx="100" cy="55" r="2.5" fill="#fde047" className="float-spore-3" style={{ filter: 'drop-shadow(0 0 2px #eab308)' }} />
                <circle cx="80" cy="40" r="2" fill="#a7f3d0" className="float-spore-4" style={{ filter: 'drop-shadow(0 0 2px #34d399)' }} />

                {/* Giant multi-layered leaf canopy shading */}
                <circle cx="100" cy="58" r="55" fill="url(#cloverGlow)" opacity="0.8" />
                <circle cx="55" cy="85" r="35" fill="#042f14" opacity="0.35" />
                <circle cx="145" cy="75" r="35" fill="#042f14" opacity="0.35" />
                <circle cx="100" cy="45" r="42" fill="#0f5125" opacity="0.25" />

                {/* Thick Root Base flaring dynamically into soil */}
                <path d="M 72 184 Q 85 178, 92 175" stroke="url(#barkGrad)" strokeWidth="11" strokeLinecap="round" />
                <path d="M 128 184 Q 115 178, 108 175" stroke="url(#barkGrad)" strokeWidth="11" strokeLinecap="round" />

                {/* Ancient gnarled wooden trunk */}
                <path d="M 87 183 C 91 142, 88 105, 93 82 L 107 82 C 112 105, 109 142, 113 183 Z" fill="url(#barkGrad)" />
                {/* Rich bark fissures & details */}
                <path d="M 91 160 Q 97 120, 95 89" stroke="#1f0a01" strokeWidth="2.5" opacity="0.8" fill="none" />
                <path d="M 100 178 Q 103 130, 101 85" stroke="#1f0a01" strokeWidth="2.2" opacity="0.75" fill="none" />
                <path d="M 109 165 Q 105 115, 106 93" stroke="#1f0a01" strokeWidth="1.8" opacity="0.6" fill="none" />
                <path d="M 95 172 Q 98 145, 97 120" stroke="#b45309" strokeWidth="0.8" opacity="0.35" fill="none" />
                <path d="M 105 172 Q 102 145, 103 125" stroke="#b45309" strokeWidth="0.8" opacity="0.35" fill="none" />

                {/* Large spreading branches */}
                <path d="M 93 122 Q 65 96, 48 84" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="9" strokeLinecap="round" />
                <path d="M 107 115 Q 135 88, 152 76" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="8" strokeLinecap="round" />
                <path d="M 95 82 Q 68 55, 58 45" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="6" strokeLinecap="round" />
                <path d="M 105 80 Q 132 55, 142 45" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 98 82 Q 88 50, 86 38" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="5" strokeLinecap="round" />
                <path d="M 102 82 Q 112 50, 114 38" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="5" strokeLinecap="round" />
                <path d="M 100 82 Q 100 48, 100 36" fill="none" stroke="url(#barkBranchGrad)" strokeWidth="4" strokeLinecap="round" />

                {/* Highly Dense Clover Foliage Placement */}
                <use href="#clover-3" x="42" y="80" transform="scale(0.9) rotate(-55)" />
                <use href="#clover-3" x="158" y="70" transform="scale(0.9) rotate(55)" />
                <use href="#clover-3" x="54" y="42" transform="scale(0.85) rotate(-30)" />
                <use href="#clover-3" x="146" y="42" transform="scale(0.85) rotate(30)" />
                <use href="#clover-3" x="80" y="32" transform="scale(0.85) rotate(-10)" />
                <use href="#clover-3" x="120" y="32" transform="scale(0.85) rotate(10)" />
                <use href="#clover-3" x="100" y="24" transform="scale(0.95) rotate(0)" />
                <use href="#clover-3" x="70" y="62" transform="scale(0.75) rotate(-20)" />
                <use href="#clover-3" x="130" y="60" transform="scale(0.75) rotate(20)" />

                {/* Two Glowing Four-Leaf Clovers */}
                <use href="#clover-4" x="72" y="88" transform="scale(0.75) rotate(-10)" />
                <use href="#clover-4" x="128" y="80" transform="scale(0.75) rotate(10)" />

                {/* Legend: Golden Four-Leaf Clover right at the crown center */}
                <use href="#clover-4-gold" x="100" y="48" transform="scale(0.8) rotate(5)" />

                {/* Shimmering magic sparkle details */}
                <use href="#magic-sparkle" x="30" y="45" className="pulse-magic" transform="scale(1.2)" />
                <use href="#magic-sparkle" x="170" y="35" className="pulse-magic" transform="scale(0.9)" />
                <use href="#magic-sparkle" x="100" y="5" className="pulse-magic" transform="scale(1.5)" />
                <use href="#magic-sparkle" x="60" y="10" className="pulse-magic" transform="scale(0.8)" />
                <use href="#magic-sparkle" x="140" y="15" className="pulse-magic" transform="scale(1.1)" />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Stage Info Header */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary mb-2 shadow-sm">
          <span className="text-lg">{currentStage.emoji}</span>
          <span className="text-sm font-bold text-foreground">{currentStage.label}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">{currentStage.desc}</p>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
          <span>{xp} XP total</span>
          {currentStage.next ? (
            <span>{currentStage.next - xp} XP to next stage</span>
          ) : (
            <span className="text-primary flex items-center gap-1">
              Max level reached! <use href="#magic-sparkle" className="w-3 h-3 text-yellow-500 fill-yellow-500 animate-spin" />
            </span>
          )}
        </div>
        <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden border border-border/30">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${progressToNext}%`,
              background: `linear-gradient(90deg, ${currentStage.color}aa, ${currentStage.color})`
            }}
          />
        </div>
        {/* Stage dots */}
        <div className="flex justify-between mt-1 px-1">
          {stages.map((s, i) => (
            <div 
              key={s.label}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= stageIdx ? 'scale-125' : 'opacity-30'}`}
              style={{ backgroundColor: i <= stageIdx ? s.color : '#94a3b8' }}
              title={`${s.label} (requires ${s.min} XP)`}
            />
          ))}
        </div>
      </div>

      {/* XP Earning Tips */}
      <div className="mt-6 space-y-2 text-[10px] font-semibold text-muted-foreground border-t border-border/50 pt-4">
        <p className="font-bold text-foreground text-xs mb-1.5">How to grow your tree:</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-lg border border-border/30">
            <span className="text-primary font-bold">+10 XP</span> 
            <span>Complete Focus Session</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-lg border border-border/30">
            <span className="text-primary font-bold">+5 XP</span> 
            <span>Focus Session &ge; 1 hr</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-lg border border-border/30">
            <span className="text-primary font-bold">+2 XP</span> 
            <span>Watch Classroom Video</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-lg border border-border/30">
            <span className="text-primary font-bold">+1 XP</span> 
            <span>Daily Streak Bonus 🍀</span>
          </div>
        </div>
      </div>
    </div>
  );
}

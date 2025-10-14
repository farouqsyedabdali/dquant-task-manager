import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Use VITE_API_URL environment variable, or detect environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://dquant-task-manager-production.up.railway.app/api' 
    : 'http://localhost:3000/api');

// Import OS icons
import windowsIcon from '../../assets/windows-11-icon.png';
import macosIcon from '../../assets/macos-icon.png';
import linuxIcon from '../../assets/linux-icon.png';

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenInBrowser = () => {
    navigate('/login');
  };

    return (
    <>
      <style>{`
        * {
          font-display: swap;
        }
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4rem) !important;
          line-height: 1.1 !important;
          font-weight: 900 !important;
        }
        
        @keyframes float-cursor {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(20px, -10px); }
          50% { transform: translate(40px, 10px); }
          75% { transform: translate(60px, -5px); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes move-avatar-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, 20px); }
        }
        
        @keyframes move-avatar-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -15px); }
        }
        
        @keyframes move-avatar-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(15px, -25px); }
        }
        
        @keyframes bar-grow {
          0%, 100% { transform: scaleY(0.6); }
          50% { transform: scaleY(1); }
        }
        
        @keyframes pulse-shield {
          0%, 100% { border-color: rgba(34, 197, 94, 0.6); }
          50% { border-color: rgba(34, 197, 94, 1); }
        }
        
        @keyframes sync-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* Additional keyframes for richer feature animations */
        @keyframes cursor-move {
          0%, 12% { top: 30%; left: 5%; }
          18% { top: 30%; left: 75%; }
          20%, 24% { top: 30%; left: 75%; }
          28% { top: 42%; left: 5%; }
          33% { top: 42%; left: 55%; }
          35%, 39% { top: 42%; left: 55%; }
          43% { top: 54%; left: 5%; }
          48% { top: 54%; left: 88%; }
          50%, 55% { top: 54%; left: 88%; }
          60% { top: 54%; left: 5%; }
          65% { top: 42%; left: 5%; }
          70% { top: 30%; left: 5%; }
          72%, 100% { top: 30%; left: 5%; opacity: 1; }
        }
        @keyframes highlight-line-1 {
          0%, 15% { width: 0%; opacity: 1; }
          18%, 55% { width: 70%; opacity: 1; }
          60%, 100% { width: 0%; opacity: 0; }
        }
        @keyframes highlight-line-2 {
          0%, 26% { width: 0%; opacity: 1; }
          33%, 55% { width: 50%; opacity: 1; }
          60%, 100% { width: 0%; opacity: 0; }
        }
        @keyframes highlight-line-3 {
          0%, 41% { width: 0%; opacity: 1; }
          48%, 55% { width: 83%; opacity: 1; }
          60%, 100% { width: 0%; opacity: 0; }
        }
        @keyframes ai-window-appear {
          0%, 40% { transform: translateY(100%) scale(0.8); opacity: 0; }
          45%, 85% { transform: translateY(0) scale(1); opacity: 1; }
          90%, 100% { transform: translateY(100%) scale(0.8); opacity: 0; }
        }
        @keyframes ai-type-line-1 {
          0%, 50% { width: 0%; }
          55%, 100% { width: 100%; }
        }
        @keyframes ai-type-line-2 {
          0%, 60% { width: 0%; }
          65%, 100% { width: 85%; }
        }
        @keyframes ai-type-line-3 {
          0%, 70% { width: 0%; }
          75%, 100% { width: 90%; }
        }
        @keyframes ai-type-line-4 {
          0%, 80% { width: 0%; }
          85%, 100% { width: 65%; }
        }
        @keyframes user-message-appear {
          0%, 8% { transform: translateY(20px); opacity: 0; }
          12%, 75% { transform: translateY(0); opacity: 1; }
          80%, 100% { transform: translateY(-10px); opacity: 0; }
        }
        @keyframes ai-message-appear {
          0%, 25% { transform: translateY(20px); opacity: 0; }
          30%, 75% { transform: translateY(0); opacity: 1; }
          80%, 100% { transform: translateY(-10px); opacity: 0; }
        }
        @keyframes ai-text-type {
          0%, 30% { width: 0; }
          35%, 75% { width: 100%; }
          80%, 100% { width: 100%; }
        }
        @keyframes connection-pulse {
          0%, 100% { stroke-opacity: 0.3; }
          50% { stroke-opacity: 1; }
        }
        @keyframes number-change {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes lock-shackle-open {
          0%, 30% { transform: translateX(-50%) rotate(0deg); }
          40%, 60% { transform: translateX(-50%) rotate(-45deg); }
          70%, 100% { transform: translateX(-50%) rotate(0deg); }
        }
        @keyframes security-blink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes pulse-send {
          0%, 20% { opacity: 0; r: 2; }
          30%, 50% { opacity: 1; r: 8; }
          60%, 100% { opacity: 0; r: 2; }
        }
        @keyframes screen-flash-left {
          0%, 50% { opacity: 0.1; }
          60%, 75% { opacity: 1; background-color: rgba(59, 130, 246, 0.4); }
          85%, 100% { opacity: 0.1; }
        }
        @keyframes screen-flash-right {
          0%, 70% { opacity: 0.1; }
          80%, 95% { opacity: 1; background-color: rgba(59, 130, 246, 0.4); }
          100% { opacity: 0.1; }
        }
        @keyframes dashboard-card-appear {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-5px); opacity: 0.8; }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1f] via-[#15152b] to-[#1f1f35] text-white">
      {/* Fixed Company Logo in Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CN</span>
              </div>
              <span className="text-white font-bold text-xl">COMPANY NAME</span>
        </div>
      </div>

      {/* Fixed Open Task Manager Button in Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleOpenInBrowser}
          className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2 rounded-lg font-semibold text-sm md:text-base"
        >
          Open Task Manager
        </button>
          </div>

      {/* Scrollable Navigation Links */}
      <div className="flex justify-center py-8">
        <div className="hidden md:flex space-x-8">
          <button onClick={() => scrollToSection('features')} className="text-white/70 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">Features</button>
          <button onClick={() => scrollToSection('pricing')} className="text-white/70 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">Pricing</button>
          <button onClick={() => scrollToSection('download')} className="text-white/70 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">Download</button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Text and Mockup Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left - Text */}
            <div>
              <h1 className="hero-title text-white mb-6 leading-tight">
                PRODUCTIVITY THAT'S ALL SMART & SIMPLE
              </h1>
              <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl">
                Turn any highlighted text into actionable tasks instantly. From PDFs to emails, 
                create, update, and manage tasks with the power of AI. Your productivity revolution starts here.
              </p>
              </div>

            {/* Right - Mockup */}
            <div className="relative">
              <div className="relative w-full h-96 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 rounded-2xl border border-white/30 backdrop-blur-lg overflow-hidden">
                {/* Mock browser window */}
                <div className="absolute top-4 left-4 right-4 h-8 bg-white/10 rounded-lg flex items-center px-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center text-white/60 text-sm">AI Task Manager</div>
                    </div>
                
                {/* Mock content */}
                <div className="absolute top-16 left-4 right-4 bottom-4 bg-white/5 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-white/20 rounded w-3/4"></div>
                    <div className="h-4 bg-white/15 rounded w-1/2"></div>
                    <div className="h-4 bg-white/10 rounded w-5/6"></div>
                    <div className="h-8 bg-[#5865f2]/30 rounded w-1/3 mt-6"></div>
                  </div>
                </div>
                
                {/* Floating task cards */}
                <div className="absolute top-20 right-6 w-16 h-12 bg-green-500/40 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                
                <div className="absolute bottom-16 left-6 w-14 h-10 bg-blue-500/40 rounded-lg flex items-center justify-center">
                  <span className="text-sm">📝</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Centered Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollToSection('download')}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-8 py-3 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              <span>⬇️</span>
              Download App
            </button>
            <button
              onClick={handleOpenInBrowser}
              className="bg-transparent border-2 border-gray-600 hover:border-gray-500 hover:bg-white/5 text-white px-8 py-3 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              <span>🌐</span>
              Open in Browser
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Everything you need to manage tasks efficiently, powered by cutting-edge AI technology
            </p>
          </div>

          <div className="space-y-20">
            {[
              {
                icon: "🎯",
                title: "Smart Text Recognition",
                description: "Highlight any text from PDFs, emails, or documents and instantly create tasks. Our AI understands context and automatically categorizes your work.",
                animation: "floating-cursor"
              },
              {
                icon: "🤖",
                title: "AI-Powered Assistant",
                description: "Intelligent task suggestions, automatic categorization, and smart prioritization. Let AI handle the thinking while you focus on doing.",
                animation: "spinning-gears"
              },
              {
                icon: "👥",
                title: "Team Collaboration",
                description: "Assign tasks, add co-assignees, and track progress across your entire team. Real-time updates keep everyone synchronized.",
                animation: "moving-avatars"
              },
              {
                icon: "📊",
                title: "Advanced Analytics",
                description: "Comprehensive reporting and insights to optimize your productivity. Track patterns, identify bottlenecks, and improve workflows.",
                animation: "animated-chart"
              },
              {
                icon: "🔒",
                title: "Enterprise Security",
                description: "Bank-level security with audit logs and role-based access control. Your data is protected with industry-standard encryption.",
                animation: "security-shield"
              },
              {
                icon: "⚡",
                title: "Real-time Sync",
                description: "Instant synchronization across all your devices and platforms. Start on desktop, continue on mobile, finish on tablet.",
                animation: "syncing-devices"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-12 ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <div className="flex-1">
                  <div className="bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 hover:border-white/30 rounded-2xl p-8 transition-colors cursor-pointer">
                    <div className="text-5xl mb-6">{feature.icon}</div>
                    <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-lg text-white/70 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="relative w-full h-80 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                    {/* Animated content based on feature type */}
                    {feature.animation === 'floating-cursor' && (
                      <>
                        {/* Document with skeleton text */}
                        <div className="absolute inset-4 bg-white/5 rounded-xl p-4">
                          <div className="space-y-3">
                            {/* Skeleton text lines with highlights */}
                            <div className="relative">
                              <div className="h-3 bg-white/10 rounded w-3/4 animate-pulse"></div>
                              {/* Highlight on line 1 */}
                              <div 
                                className="absolute top-0 left-0 h-3 bg-blue-400/50 rounded"
                                style={{
                                  animation: 'highlight-line-1 6s ease-out infinite',
                                  width: '0%'
                                }}
                              ></div>
                            </div>
                            
                            <div className="relative">
                              <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              {/* Highlight on line 2 */}
                              <div 
                                className="absolute top-0 left-0 h-3 bg-blue-400/50 rounded"
                                style={{
                                  animation: 'highlight-line-2 6s ease-out infinite',
                                  width: '0%'
                                }}
                              ></div>
                            </div>
                            
                            <div className="relative">
                              <div className="h-3 bg-white/10 rounded w-5/6 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                              {/* Highlight on line 3 */}
                              <div 
                                className="absolute top-0 left-0 h-3 bg-blue-400/50 rounded"
                                style={{
                                  animation: 'highlight-line-3 6s ease-out infinite',
                                  width: '0%'
                                }}
                              ></div>
                            </div>
                            
                            <div className="h-3 bg-white/10 rounded w-2/3 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                            <div className="h-3 bg-white/10 rounded w-4/5 animate-pulse" style={{ animationDelay: '0.8s' }}></div>
                          </div>
                        </div>
                        
                        {/* Mouse cursor */}
                        <div 
                          className="absolute w-5 h-5 pointer-events-none z-10"
                          style={{
                            animation: 'cursor-move 6s ease-in-out infinite'
                          }}
                        >
                          {/* Cursor SVG */}
                          <svg viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1" className="drop-shadow-lg">
                            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                          </svg>
                        </div>
                        
                        {/* AI window in bottom right */}
                        <div 
                          className="absolute bottom-2 right-2 w-32 h-24 bg-gradient-to-br from-purple-600/90 to-indigo-600/90 backdrop-blur-sm rounded-lg shadow-2xl p-2 border border-purple-400/30"
                          style={{
                            animation: 'ai-window-appear 6s ease-in-out infinite'
                          }}
                        >
                          {/* AI header */}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse"></div>
                              <div className="text-[9px] text-purple-100 font-semibold">AI Assistant</div>
                            </div>
                          </div>
                          
                          {/* Generated text lines */}
                          <div className="space-y-1">
                            <div className="h-1.5 bg-purple-200/80 rounded overflow-hidden">
                              <div 
                                className="h-full bg-white/90"
                                style={{ animation: 'ai-type-line-1 6s ease-out infinite', width: '0%' }}
                              ></div>
                            </div>
                            <div className="h-1.5 bg-purple-200/80 rounded overflow-hidden">
                              <div 
                                className="h-full bg-white/90"
                                style={{ animation: 'ai-type-line-2 6s ease-out infinite', width: '0%' }}
                              ></div>
                            </div>
                            <div className="h-1.5 bg-purple-200/80 rounded overflow-hidden">
                              <div 
                                className="h-full bg-white/90"
                                style={{ animation: 'ai-type-line-3 6s ease-out infinite', width: '0%' }}
                              ></div>
                            </div>
                            <div className="h-1.5 bg-purple-200/80 rounded overflow-hidden">
                              <div 
                                className="h-full bg-white/90"
                                style={{ animation: 'ai-type-line-4 6s ease-out infinite', width: '0%' }}
                        ></div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {feature.animation === 'spinning-gears' && (
                      <div className="absolute inset-4 bg-white/5 rounded-xl p-4">
                        {/* AI Chat Interface */}
                        <div className="space-y-4">
                          {/* User message - appears first */}
                          <div 
                            className="flex justify-end"
                            style={{
                              animation: 'user-message-appear 6s ease-out infinite'
                            }}
                          >
                            <div className="bg-blue-500/40 rounded-lg p-3 max-w-[70%] shadow-lg">
                              <div className="text-sm text-white font-medium">Help me organize my tasks</div>
                            </div>
                          </div>
                          
                          {/* AI response - types out procedurally */}
                          <div 
                            className="flex justify-start"
                            style={{
                              animation: 'ai-message-appear 6s ease-out infinite'
                            }}
                          >
                            <div className="bg-purple-500/40 rounded-lg p-3 max-w-[75%] shadow-lg">
                              <div className="text-sm text-white">
                                <div 
                                  className="overflow-hidden"
                                  style={{
                                    animation: 'ai-text-type 6s steps(30, end) infinite',
                                    width: '0',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  I'll prioritize by urgency...
                          </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {feature.animation === 'moving-avatars' && (
                      <div className="absolute inset-4">
                        {/* Network nodes - 10 team members strategically positioned */}
                        {/* A - Major hub (top-left) */}
                        <div className="absolute w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ top: '15%', left: '15%' }}>A</div>
                        {/* B - Connected to A, H */}
                        <div className="absolute w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ top: '10%', left: '40%' }}>B</div>
                        {/* C - Biggest hub (center) */}
                        <div className="absolute w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ top: '45%', left: '50%' }}>C</div>
                        {/* D - Connected to A, E, G */}
                        <div className="absolute w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ top: '35%', left: '10%' }}>D</div>
                        {/* E - Leaf node (only connected to D) */}
                        <div className="absolute w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ top: '60%', left: '5%' }}>E</div>
                        {/* F - Connected to A, C */}
                        <div className="absolute w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ top: '25%', left: '30%' }}>F</div>
                        {/* G - Connected to C, D, J */}
                        <div className="absolute w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ top: '55%', left: '30%' }}>G</div>
                        {/* H - Connected to B, C */}
                        <div className="absolute w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ top: '20%', left: '65%' }}>H</div>
                        {/* I - Connected to C, J */}
                        <div className="absolute w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ top: '70%', left: '55%' }}>I</div>
                        {/* J - Connected to G, I */}
                        <div className="absolute w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ top: '75%', left: '35%' }}>J</div>
                        
                        {/* Connecting lines - creating the network */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          {/* A connections (hub): A-B, A-D, A-F (A-C disconnected) */}
                          {/* A to B */}
                          <line x1="24%" y1="18%" x2="41%" y2="13%" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite' }} />
                          {/* A to D */}
                          <line x1="18%" y1="24%" x2="14%" y2="36%" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite 0.6s' }} />
                          {/* A to F */}
                          <line x1="23%" y1="22%" x2="32%" y2="28%" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite 0.9s' }} />
                          
                          {/* B connections: B-H */}
                          <line x1="49%" y1="13%" x2="66%" y2="22%" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite 1.2s' }} />
                          
                          {/* C connections (biggest hub): C-F, C-G, C-H, C-I */}
                          {/* C to F */}
                          <line x1="51%" y1="43%" x2="38%" y2="32%" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite 1.5s' }} />
                          {/* C to G */}
                          <line x1="51%" y1="52%" x2="38%" y2="58%" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite 1.8s' }} />
                          {/* C to H */}
                          <line x1="58%" y1="43%" x2="67%" y2="27%" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite 2.1s' }} />
                          {/* C to I */}
                          <line x1="57%" y1="53%" x2="58%" y2="72%" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite 2.4s' }} />
                          
                          {/* D connections: D-E, D-G */}
                          {/* D to E */}
                          <line x1="13%" y1="44%" x2="9%" y2="61%" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite 2.7s' }} />
                          {/* D to G */}
                          <line x1="18%" y1="43%" x2="31%" y2="57%" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite 3s' }} />
                          
                          {/* G connections: G-J */}
                          <line x1="36%" y1="63%" x2="39%" y2="77%" stroke="rgba(239, 68, 68, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite 3.3s' }} />
                          
                          {/* I connections: I-J */}
                          <line x1="56%" y1="77%" x2="43%" y2="79%" stroke="rgba(20, 184, 166, 0.5)" strokeWidth="2" style={{ animation: 'connection-pulse 4s ease-in-out infinite 3.6s' }} />
                        </svg>
                        
                        {/* Subtle pulse effects on hub nodes */}
                        <div className="absolute w-10 h-10 bg-blue-500/20 rounded-full animate-ping" style={{ top: '15%', left: '15%', animationDuration: '3s' }}></div>
                        <div className="absolute w-10 h-10 bg-purple-500/20 rounded-full animate-ping" style={{ top: '45%', left: '50%', animationDuration: '3s', animationDelay: '0.5s' }}></div>
                      </div>
                    )}
                    
                    {feature.animation === 'animated-chart' && (
                      <div className="absolute inset-4 bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-xl p-4 border border-white/10">
                        {/* Dashboard header */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-sm text-white font-semibold">Analytics Dashboard</div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <div className="text-xs text-green-400">Live</div>
                          </div>
                        </div>
                        
                        {/* Chart area with grid */}
                        <div className="relative h-28 mb-3 border border-white/5 rounded bg-black/20 p-2">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between p-2">
                            {[0, 1, 2, 3].map(i => (
                              <div key={i} className="border-t border-white/5"></div>
                            ))}
                          </div>
                          {/* Chart bars */}
                          <div className="relative h-full flex items-end justify-around">
                            {[45, 75, 35, 85, 55, 95, 65, 80].map((height, i) => (
                            <div
                              key={i}
                                className="bg-gradient-to-t from-blue-500/80 to-purple-500/80 w-8 rounded-t shadow-lg"
                                style={{ height: `${height}%`, animation: `bar-grow 3s ease-in-out infinite ${i * 0.2}s` }}
                            ></div>
                          ))}
                          </div>
                        </div>
                        
                        {/* Stats cards */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-blue-500/20 border border-blue-500/30 rounded p-2" style={{ animation: 'dashboard-card-appear 3s ease-in-out infinite' }}>
                            <div className="text-[10px] text-blue-300">Tasks</div>
                            <div className="text-lg text-white font-bold">247</div>
                          </div>
                          <div className="bg-green-500/20 border border-green-500/30 rounded p-2" style={{ animation: 'dashboard-card-appear 3s ease-in-out infinite 0.3s' }}>
                            <div className="text-[10px] text-green-300">Done</div>
                            <div className="text-lg text-white font-bold">189</div>
                          </div>
                          <div className="bg-purple-500/20 border border-purple-500/30 rounded p-2" style={{ animation: 'dashboard-card-appear 3s ease-in-out infinite 0.6s' }}>
                            <div className="text-[10px] text-purple-300">Rate</div>
                            <div className="text-lg text-green-400 font-bold">94%</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {feature.animation === 'security-shield' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Lock body */}
                        <div className="relative">
                          {/* Lock body base */}
                          <div className="w-20 h-24 bg-gradient-to-br from-green-500/30 to-emerald-600/30 rounded-lg border-3 border-green-400/80 flex items-center justify-center shadow-xl backdrop-blur-sm">
                            {/* Keyhole */}
                            <div className="flex flex-col items-center">
                              <div className="w-4 h-4 bg-green-400/60 rounded-full"></div>
                              <div className="w-2 h-6 bg-green-400/60" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}></div>
                            </div>
                          </div>
                          
                          {/* Lock shackle - opens and closes */}
                          <div 
                            className="absolute -top-8 left-1/2 w-12 h-16 border-4 border-green-400 rounded-t-full bg-transparent" 
                            style={{ 
                              animation: 'lock-shackle-open 4s ease-in-out infinite', 
                              transformOrigin: 'bottom left',
                              transform: 'translateX(-50%)'
                            }}
                          ></div>
                          
                          {/* Security indicators */}
                          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50" style={{ animation: 'security-blink 2s ease-in-out infinite' }}></div>
                            <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50" style={{ animation: 'security-blink 2s ease-in-out infinite 0.5s' }}></div>
                            <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50" style={{ animation: 'security-blink 2s ease-in-out infinite 1s' }}></div>
                          </div>
                          
                          {/* Secure text */}
                          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-green-400 text-xs font-semibold whitespace-nowrap">
                            Secured
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {feature.animation === 'syncing-devices' && (
                      <div className="absolute inset-4 flex justify-around items-center">
                        {/* Left Computer (Desktop) */}
                        <div className="relative flex flex-col items-center">
                          {/* Monitor */}
                          <div className="relative w-20 h-16 bg-gray-700/80 rounded-t border-2 border-gray-600">
                            {/* Screen */}
                            <div 
                              className="absolute inset-2 rounded bg-gray-900/50"
                              style={{ animation: 'screen-flash-left 4s ease-in-out infinite' }}
                            ></div>
                          </div>
                          {/* Stand */}
                          <div className="w-2 h-3 bg-gray-600"></div>
                          <div className="w-12 h-1 bg-gray-600 rounded"></div>
                        </div>
                        
                        {/* Connection lines and pulses */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          {/* Left line */}
                          <line x1="30%" y1="50%" x2="45%" y2="50%" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2" strokeDasharray="5,5" />
                          {/* Right line */}
                          <line x1="55%" y1="50%" x2="70%" y2="50%" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2" strokeDasharray="5,5" />
                          
                          {/* Pulse from center to left */}
                          <circle cx="45%" cy="50%" fill="rgba(59, 130, 246, 0.8)">
                            <animate attributeName="cx" values="50%;45%;35%" dur="4s" repeatCount="indefinite" begin="0.5s" />
                            <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" begin="0.5s" />
                          </circle>
                          
                          {/* Pulse from center to right */}
                          <circle cx="55%" cy="50%" fill="rgba(59, 130, 246, 0.8)">
                            <animate attributeName="cx" values="50%;55%;65%" dur="4s" repeatCount="indefinite" begin="0.5s" />
                            <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" begin="0.5s" />
                          </circle>
                        </svg>
                        
                        {/* Middle Laptop (receives update) */}
                        <div className="relative flex flex-col items-center z-10">
                          {/* Laptop screen */}
                          <div className="relative w-24 h-16 bg-gray-700/80 rounded-t border-2 border-gray-600">
                            {/* Screen with update indicator */}
                            <div className="absolute inset-2 rounded bg-blue-500/40">
                              {/* Update notification */}
                              <div className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          {/* Laptop base */}
                          <div className="w-28 h-1 bg-gray-600 rounded-b"></div>
                        </div>
                        
                        {/* Right Computer (Desktop) */}
                        <div className="relative flex flex-col items-center">
                          {/* Monitor */}
                          <div className="relative w-20 h-16 bg-gray-700/80 rounded-t border-2 border-gray-600">
                            {/* Screen */}
                            <div 
                              className="absolute inset-2 rounded bg-gray-900/50"
                              style={{ animation: 'screen-flash-right 4s ease-in-out infinite' }}
                            ></div>
                          </div>
                          {/* Stand */}
                          <div className="w-2 h-3 bg-gray-600"></div>
                          <div className="w-12 h-1 bg-gray-600 rounded"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Simple Pricing
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Choose the plan that fits your needs. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Personal",
                price: "Free",
                period: "Forever",
                features: [
                  "Up to 50 tasks",
                  "Basic AI features",
                  "1 user account",
                  "Email support",
                  "Mobile app access",
                  "Browser extension"
                ],
                popular: false
              },
              {
                name: "Professional",
                price: "$9.99",
                period: "per month",
                features: [
                  "Unlimited tasks",
                  "Advanced AI features",
                  "Up to 10 users",
                  "Priority support",
                  "Advanced analytics",
                  "Team collaboration",
                  "Custom integrations",
                  "Audit logs"
                ],
                popular: true
              }
            ].map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white/10 hover:bg-white/15 backdrop-blur-xl border rounded-2xl p-8 transition-colors cursor-pointer ${
                  plan.popular 
                    ? 'border-[#5865f2] hover:border-[#4752c4] bg-gradient-to-br from-[#5865f2]/20 to-[#4752c4]/20' 
                    : 'border-white/20 hover:border-white/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#5865f2] text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    {plan.price}
                    {plan.price !== "Custom" && <span className="text-lg text-white/70">/{plan.period}</span>}
                  </div>
                  {plan.price === "Custom" && <p className="text-white/70">{plan.period}</p>}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-white/70">
                      <span className="text-green-400 mr-3">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                      : 'border-2 border-gray-600 hover:border-gray-500 hover:bg-white/5 text-white'
                  }`}
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/70 mb-12">
              Download COMPANY NAME Task Manager and transform your productivity today
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  platform: "Windows",
                  icon: windowsIcon,
                  version: "v0.0.2",
                  size: "Latest",
                  url: `${API_BASE_URL}/downloads/windows/latest`,
                  available: true
                },
                {
                  platform: "macOS",
                  icon: macosIcon,
                  version: "Coming soon",
                  size: "52.1 MB",
                  url: "#",
                  available: false
                },
                {
                  platform: "Linux",
                  icon: linuxIcon,
                  version: "Coming soon",
                  size: "48.7 MB",
                  url: "#",
                  available: false
                }
              ].map((download, index) => (
                <div
                  key={index}
                  className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 transition-colors ${
                    download.available 
                      ? 'hover:bg-white/15 hover:border-white/30 cursor-pointer' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (download.available && download.url !== '#') {
                      window.open(download.url, '_blank');
                    }
                  }}
                >
                  <div className="flex items-center justify-center mb-4">
                    <img src={download.icon} alt={download.platform} className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 text-center">{download.platform}</h3>
                  <p className="text-gray-400 mb-2 text-center">Version {download.version}</p>
                  <p className="text-sm text-gray-500 mb-4 text-center">{download.size}</p>
                  <div className={`text-center py-2 px-4 rounded-lg font-semibold transition-colors ${
                    download.available
                      ? 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {download.available ? 'Download' : 'Coming Soon'}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">System Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Minimum Requirements</h4>
                  <ul className="space-y-2 text-white/70">
                    <li>• Windows 10 or macOS 10.15 or Ubuntu 18.04</li>
                    <li>• 4GB RAM</li>
                    <li>• 100MB free disk space</li>
                    <li>• Internet connection</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Recommended</h4>
                  <ul className="space-y-2 text-white/70">
                    <li>• Windows 11 or macOS 12 or Ubuntu 20.04</li>
                    <li>• 8GB RAM</li>
                    <li>• 500MB free disk space</li>
                    <li>• High-speed internet connection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CN</span>
                </div>
                <span className="text-white font-bold text-xl">COMPANY NAME</span>
              </div>
              <p className="text-white/70">
                Revolutionizing productivity with AI-powered task management.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Download</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/70">
            <p>&copy; 2024 COMPANY NAME. All rights reserved. Made with ❤️ for productivity enthusiasts.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default LandingPage;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Use localhost for development, Railway for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://dquant-task-manager-production.up.railway.app/api');

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
        @keyframes highlight-cursor {
          0% { left: 10%; }
          25% { left: 35%; }
          50% { left: 60%; }
          75% { left: 80%; }
          100% { left: 10%; }
        }
        @keyframes ai-generate-1 {
          0%, 70% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes ai-generate-2 {
          0%, 70% { width: 0%; }
          100% { width: 80%; }
        }
        @keyframes ai-generate-3 {
          0%, 70% { width: 0%; }
          100% { width: 60%; }
        }
        @keyframes type-text {
          0% { width: 0; }
          100% { width: 100%; }
        }
        @keyframes ai-thinking {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
        @keyframes connection-pulse {
          0%, 100% { stroke-opacity: 0.3; }
          50% { stroke-opacity: 1; }
        }
        @keyframes number-change {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes lock-shackle {
          0%, 50% { transform: translateX(-50%) rotate(0deg); }
          25% { transform: translateX(-50%) rotate(-10deg); }
          75% { transform: translateX(-50%) rotate(10deg); }
          100% { transform: translateX(-50%) rotate(0deg); }
        }
        @keyframes security-blink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes device-screen-change {
          0%, 80% { background-color: rgba(255, 255, 255, 0.1); }
          90% { background-color: rgba(34, 197, 94, 0.3); }
          100% { background-color: rgba(255, 255, 255, 0.1); }
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
                        {/* Document with text */}
                        <div className="absolute inset-4 bg-white/5 rounded-xl p-4">
                          <div className="space-y-2">
                            <div className="h-3 bg-white/20 rounded w-3/4"></div>
                            <div className="h-3 bg-white/15 rounded w-1/2"></div>
                            <div className="h-3 bg-blue-400/50 rounded w-5/6"></div>
                            <div className="h-3 bg-white/10 rounded w-2/3"></div>
                            <div className="h-3 bg-white/15 rounded w-4/5"></div>
                          </div>
                        </div>
                        {/* Cursor highlighting text */}
                        <div 
                          className="absolute w-1 h-4 bg-blue-400"
                          style={{
                            animation: 'highlight-cursor 4s ease-in-out infinite',
                            top: '52%',
                            left: '25%'
                          }}
                        ></div>
                        {/* AI generating text in corner */}
                        <div className="absolute top-2 right-2 w-20 h-14 bg-purple-500/20 rounded p-1">
                          <div className="text-[10px] text-purple-300">AI</div>
                          <div className="space-y-1 mt-1">
                            <div className="h-1 bg-purple-400/60 rounded" style={{ animation: 'ai-generate-1 3s ease-in-out infinite', width: '0%' }}></div>
                            <div className="h-1 bg-purple-400/60 rounded" style={{ animation: 'ai-generate-2 3s ease-in-out infinite 1s', width: '0%' }}></div>
                            <div className="h-1 bg-purple-400/60 rounded" style={{ animation: 'ai-generate-3 3s ease-in-out infinite 2s', width: '0%' }}></div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {feature.animation === 'spinning-gears' && (
                      <div className="absolute inset-4 bg-white/5 rounded-xl p-4">
                        {/* AI Chat Interface */}
                        <div className="space-y-3">
                          <div className="flex justify-end">
                            <div className="bg-blue-500/30 rounded-lg p-2 max-w-xs">
                              <div className="text-md text-white">Help me organize my tasks</div>
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <div className="bg-purple-500/30 rounded-lg p-2 max-w-xs">
                              <div className="text-xs text-white overflow-hidden whitespace-nowrap" style={{ width: '25ch' }}>
                                <span style={{ display: 'inline-block', animation: 'type-text 4s steps(12,end) infinite' }}>
                                  I'll help you prioritize...
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* AI thinking indicator */}
                          <div className="flex justify-start">
                            <div className="bg-purple-500/20 rounded-lg p-2">
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-purple-400 rounded-full" style={{ animation: 'ai-thinking 1.5s ease-in-out infinite' }}></div>
                                <div className="w-1 h-1 bg-purple-400 rounded-full" style={{ animation: 'ai-thinking 1.5s ease-in-out infinite 0.2s' }}></div>
                                <div className="w-1 h-1 bg-purple-400 rounded-full" style={{ animation: 'ai-thinking 1.5s ease-in-out infinite 0.4s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {feature.animation === 'moving-avatars' && (
                      <div className="absolute inset-4">
                        {/* Team members */}
                        <div className="absolute w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ top: '20%', left: '10%' }}>A</div>
                        <div className="absolute w-10 h-10 bg-green-400 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ top: '60%', left: '70%' }}>B</div>
                        <div className="absolute w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ top: '30%', left: '45%' }}>C</div>
                        <div className="absolute w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ top: '70%', left: '25%' }}>D</div>
                        {/* Connecting lines */}
                        <svg className="absolute inset-0 w-full h-full">
                          <line x1="15%" y1="25%" x2="50%" y2="35%" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2" style={{ animation: 'connection-pulse 3s ease-in-out infinite' }} />
                          <line x1="50%" y1="35%" x2="75%" y2="65%" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="2" style={{ animation: 'connection-pulse 3s ease-in-out infinite 1s' }} />
                          <line x1="30%" y1="75%" x2="50%" y2="35%" stroke="rgba(168, 85, 247, 0.6)" strokeWidth="2" style={{ animation: 'connection-pulse 3s ease-in-out infinite 2s' }} />
                          <line x1="15%" y1="25%" x2="30%" y2="75%" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="2" style={{ animation: 'connection-pulse 3s ease-in-out infinite 0.5s' }} />
                        </svg>
                      </div>
                    )}
                    
                    {feature.animation === 'animated-chart' && (
                      <div className="absolute inset-4 bg-white/5 rounded-xl p-3">
                        {/* Dashboard header */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs text-white/70">Analytics Dashboard</div>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <div className="text-xs text-green-400">Live</div>
                          </div>
                        </div>
                        {/* Chart area */}
                        <div className="h-32 flex items-end justify-center space-x-1">
                          {[40, 70, 30, 80, 50, 90, 60].map((height, i) => (
                            <div
                              key={i}
                              className="bg-gradient-to-t from-blue-400/60 to-purple-400/60 w-6 rounded-t"
                              style={{ height: `${height}%`, animation: `bar-grow 3s ease-in-out infinite ${i * 0.3}s` }}
                            ></div>
                          ))}
                        </div>
                        {/* Stats cards */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="bg-white/10 rounded p-1">
                            <div className="text-xs text-white/60">Tasks</div>
                            <div className="text-sm text-white font-bold" style={{ animation: 'number-change 2s ease-in-out infinite' }}>247</div>
                          </div>
                          <div className="bg-white/10 rounded p-1">
                            <div className="text-xs text-white/60">Efficiency</div>
                            <div className="text-sm text-green-400 font-bold" style={{ animation: 'number-change 2s ease-in-out infinite 1s' }}>94%</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {feature.animation === 'security-shield' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Lock body */}
                        <div className="relative">
                          <div className="w-16 h-20 bg-green-400/20 rounded-lg border-2 border-green-400/60 flex items-center justify-center">
                            <div className="text-green-400 text-2xl">🔒</div>
                          </div>
                          {/* Lock shackle */}
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-10 h-12 border-4 border-green-400/80 rounded-t-full bg-transparent" style={{ animation: 'lock-shackle 4s ease-in-out infinite', transformOrigin: 'bottom center' }}></div>
                          {/* Security indicators */}
                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full" style={{ animation: 'security-blink 2s ease-in-out infinite' }}></div>
                            <div className="w-2 h-2 bg-green-400 rounded-full" style={{ animation: 'security-blink 2s ease-in-out infinite 0.5s' }}></div>
                            <div className="w-2 h-2 bg-green-400 rounded-full" style={{ animation: 'security-blink 2s ease-in-out infinite 1s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {feature.animation === 'syncing-devices' && (
                      <div className="absolute inset-4 flex justify-around items-center">
                        {/* Phone */}
                        <div className="relative w-12 h-16 bg-white/20 rounded">
                          <div className="absolute inset-1 rounded" style={{ animation: 'device-screen-change 3s ease-in-out infinite' }}></div>
                        </div>
                        {/* Pulse 1 */}
                        <div className="w-3 h-3 bg-blue-400 rounded-full" style={{ animation: 'sync-pulse 3s ease-in-out infinite' }}></div>
                        {/* Laptop */}
                        <div className="relative w-16 h-10 bg-white/20 rounded">
                          <div className="absolute inset-1 rounded" style={{ animation: 'device-screen-change 3s ease-in-out infinite 1s' }}></div>
                          <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                        {/* Pulse 2 */}
                        <div className="w-3 h-3 bg-blue-400 rounded-full" style={{ animation: 'sync-pulse 3s ease-in-out infinite 1.5s' }}></div>
                        {/* Tablet */}
                        <div className="relative w-20 h-12 bg_white/20 rounded">
                          <div className="absolute inset-1 rounded" style={{ animation: 'device-screen-change 3s ease-in-out infinite 2s' }}></div>
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

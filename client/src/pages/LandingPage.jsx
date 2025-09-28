import { useState, useEffect } from 'react';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate loading
    setTimeout(() => {
      if (password === '123456') {
        setIsAuthenticated(true);
      } else {
        alert('Incorrect password. Please try again.');
      }
      setIsLoading(false);
    }, 1000);
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md mx-4 border border-white/20"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center"
            >
              <span className="text-2xl font-bold text-white">CN</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">COMPANY NAME Task Manager</h1>
            <p className="text-white/70">Enter password to access the landing page</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Access Landing Page'
              )}
            </motion.button>
          </form>

          <p className="text-center text-white/50 text-sm mt-4">
            Password: 123456
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CN</span>
              </div>
              <span className="text-white font-bold text-xl">COMPANY NAME</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex space-x-8"
            >
              <button onClick={() => scrollToSection('features')} className="text-white/70 hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="text-white/70 hover:text-white transition-colors">Pricing</button>
              <button onClick={() => scrollToSection('download')} className="text-white/70 hover:text-white transition-colors">Download</button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Your Personal
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> AI Secretary</span>
              </h1>
              <p className="text-xl text-white/70 mb-8 leading-relaxed">
                Transform any highlighted text into actionable tasks. From PDFs to emails, 
                create, update, and manage tasks with the power of AI. Your productivity, reimagined.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection('download')}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                >
                  Download Now
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection('features')}
                  className="border-2 border-white/30 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-all duration-300"
                >
                  Learn More
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative w-full h-96 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-2xl border border-white/20 backdrop-blur-lg">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 2, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-4 bg-white/10 rounded-xl flex items-center justify-center"
                >
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <p className="text-lg font-semibold">AI-Powered</p>
                    <p className="text-sm opacity-70">Task Management</p>
                  </div>
                </motion.div>
                
                {/* Floating elements */}
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    x: [0, 10, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute top-8 right-8 w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center"
                >
                  <span className="text-2xl">✅</span>
                </motion.div>
                
                <motion.div
                  animate={{ 
                    y: [0, 15, 0],
                    x: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute bottom-8 left-8 w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center"
                >
                  <span className="text-xl">📝</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Everything you need to manage tasks efficiently, powered by cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Smart Text Recognition",
                description: "Highlight any text from PDFs, emails, or documents and instantly create tasks"
              },
              {
                icon: "🤖",
                title: "AI-Powered Assistant",
                description: "Intelligent task suggestions, automatic categorization, and smart prioritization"
              },
              {
                icon: "👥",
                title: "Team Collaboration",
                description: "Assign tasks, add co-assignees, and track progress across your entire team"
              },
              {
                icon: "📊",
                title: "Advanced Analytics",
                description: "Comprehensive reporting and insights to optimize your productivity"
              },
              {
                icon: "🔒",
                title: "Enterprise Security",
                description: "Bank-level security with audit logs and role-based access control"
              },
              {
                icon: "⚡",
                title: "Real-time Sync",
                description: "Instant synchronization across all your devices and platforms"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Simple Pricing
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Choose the plan that fits your needs. No hidden fees, no surprises.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  "Mobile app access"
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
                  "Team collaboration"
                ],
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "pricing",
                features: [
                  "Everything in Professional",
                  "Unlimited users",
                  "Custom integrations",
                  "Dedicated support",
                  "Advanced security",
                  "Custom branding"
                ],
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border ${
                  plan.popular 
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/20 to-purple-600/20' 
                    : 'border-white/20'
                } hover:bg-white/15 transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
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

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                      : 'border-2 border-white/30 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/70 mb-12">
              Download COMPANY NAME Task Manager and transform your productivity today
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[
                {
                  platform: "Windows",
                  icon: "🪟",
                  version: "v0.0.2",
                  size: "Latest",
                  url: `${API_BASE_URL}/downloads/windows/latest`
                },
                {
                  platform: "macOS",
                  icon: "🍎",
                  version: "Coming soon",
                  size: "52.1 MB",
                  url: "https://youtube.com"
                },
                {
                  platform: "Linux",
                  icon: "🐧",
                  version: "Coming soon",
                  size: "48.7 MB",
                  url: "https://youtube.com"
                }
              ].map((download, index) => (
                <motion.a
                  key={index}
                  href={download.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={download.platform === 'Windows'}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group"
                >
                  <div className="text-4xl mb-4">{download.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{download.platform}</h3>
                  <p className="text-white/70 mb-4">Version {download.version}</p>
                  <p className="text-sm text-white/50 mb-4">{download.size}</p>
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold group-hover:from-indigo-600 group-hover:to-purple-700 transition-all duration-300">
                    Download
                  </div>
                </motion.a>
              ))}
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
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
          </motion.div>
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
  );
};

export default LandingPage;

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Shield, Zap, Layout, MessageCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { loginWithFacebook, clearError } = useAuth();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    clearError();
    
    // Check for error in URL params
    const error = searchParams.get('error');
    if (error) {
      const errorMessages = {
        auth_failed: 'Facebook authentication failed. Please try again.',
        token_generation_failed: 'Failed to generate session. Please try again.',
        session_expired: 'Your session has expired. Please log in again.',
      };
      setErrorMessage(errorMessages[error] || 'An error occurred. Please try again.');
    }
  }, [searchParams, clearError]);

  const features = [
    {
      icon: Layout,
      title: 'Unified Dashboard',
      description: 'View all your pages in one place'
    },
    {
      icon: MessageCircle,
      title: 'Centralized Inbox',
      description: 'Manage comments and messages together'
    },
    {
      icon: Zap,
      title: 'Quick Responses',
      description: 'Reply faster with saved templates'
    },
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Your data stays protected'
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-slate-900 to-brand-900" />
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-40 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-display font-bold text-white mb-6">
              Manage All Your
              <span className="block text-gradient mt-2">Facebook Pages</span>
            </h1>
            <p className="text-xl text-slate-400 mb-12 max-w-md">
              Stop switching between pages. Monitor and respond to all your audience engagement from one powerful dashboard.
            </p>
          </motion.div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="glass rounded-2xl p-5"
              >
                <feature.icon className="w-8 h-8 text-brand-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30 mb-6"
            >
              <span className="text-4xl font-bold text-white">P</span>
            </motion.div>
            <h2 className="text-3xl font-display font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-400">
              Sign in to access your pages dashboard
            </p>
          </div>

          {/* Error message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </motion.div>
          )}

          {/* Login Card */}
          <div className="glass rounded-3xl p-8">
            <button
              onClick={loginWithFacebook}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-all duration-200 text-white font-semibold text-lg shadow-lg shadow-[#1877F2]/30 hover:shadow-[#1877F2]/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Facebook className="w-6 h-6" />
              Continue with Facebook
            </button>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                By continuing, you agree to grant access to your Facebook pages. 
                We only request permissions necessary for managing your page engagement.
              </p>
            </div>
          </div>

          {/* Permissions info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50"
          >
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-400" />
              Permissions we'll request
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                View list of pages you manage
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                Read comments on your pages
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                Reply to and manage comments
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                Read user content on your pages
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;


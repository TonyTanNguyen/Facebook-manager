import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleAuthCallback } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login?error=auth_failed'), 2000);
        return;
      }

      if (!token) {
        setStatus('error');
        setMessage('No authentication token received.');
        setTimeout(() => navigate('/login?error=auth_failed'), 2000);
        return;
      }

      try {
        const success = await handleAuthCallback(token);
        
        if (success) {
          setStatus('success');
          setMessage('Welcome! Redirecting to dashboard...');
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          throw new Error('Authentication failed');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('Failed to complete authentication.');
        setTimeout(() => navigate('/login?error=auth_failed'), 2000);
      }
    };

    processCallback();
  }, [searchParams, handleAuthCallback, navigate]);

  const statusConfig = {
    processing: {
      icon: Loader2,
      iconClass: 'text-brand-400 animate-spin',
      bgClass: 'from-brand-500/20 to-brand-600/20',
      borderClass: 'border-brand-500/30',
    },
    success: {
      icon: CheckCircle,
      iconClass: 'text-emerald-400',
      bgClass: 'from-emerald-500/20 to-emerald-600/20',
      borderClass: 'border-emerald-500/30',
    },
    error: {
      icon: XCircle,
      iconClass: 'text-red-400',
      bgClass: 'from-red-500/20 to-red-600/20',
      borderClass: 'border-red-500/30',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative w-full max-w-sm rounded-3xl p-8 text-center bg-gradient-to-br ${config.bgClass} border ${config.borderClass} backdrop-blur-xl`}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          animate={{
            boxShadow: status === 'processing' 
              ? ['0 0 30px rgba(12, 141, 230, 0.2)', '0 0 60px rgba(12, 141, 230, 0.3)', '0 0 30px rgba(12, 141, 230, 0.2)']
              : status === 'success'
              ? '0 0 40px rgba(16, 185, 129, 0.2)'
              : '0 0 40px rgba(239, 68, 68, 0.2)'
          }}
          transition={{
            duration: 2,
            repeat: status === 'processing' ? Infinity : 0,
            ease: "easeInOut"
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-900/50 mb-6"
          >
            <Icon className={`w-10 h-10 ${config.iconClass}`} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-display font-bold text-white mb-3"
          >
            {status === 'processing' && 'Authenticating...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Oops!'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400"
          >
            {message}
          </motion.p>

          {/* Progress dots for processing */}
          {status === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 mt-6"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-brand-400"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthCallback;


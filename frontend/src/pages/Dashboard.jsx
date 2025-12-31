import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquare, 
  MessagesSquare,
  Settings, 
  LogOut, 
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Layers,
  Users,
  TrendingUp,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { pagesAPI, statsAPI } from '../services/api';
import PagesManager from '../components/PagesManager';
import CommentsFeed from '../components/CommentsFeed';
import MessagesFeed from '../components/MessagesFeed';
import BusinessManagerSettings from '../components/BusinessManagerSettings';

// Notifications Popup Component
const NotificationsPopup = ({ stats, onNavigate, onClose }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const totalUnreplied = (stats.unrepliedMessages || 0) + (stats.unrepliedComments || 0);

  return (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 glass rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Notifications</h3>
          {totalUnreplied > 0 && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
              {totalUnreplied} pending
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="p-2">
        {/* Unreplied Messages */}
        <button
          onClick={() => {
            onNavigate('messages');
            onClose();
          }}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors group"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
            <MessagesSquare className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">Messages</span>
              {stats.unrepliedMessages > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                  {stats.unrepliedMessages}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">
              {stats.unrepliedMessages > 0 
                ? `${stats.unrepliedMessages} conversation${stats.unrepliedMessages > 1 ? 's' : ''} need reply`
                : 'All caught up!'}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        {/* Unreplied Comments */}
        <button
          onClick={() => {
            onNavigate('comments');
            onClose();
          }}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors group"
        >
          <div className="p-2.5 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
            <MessageSquare className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">Comments</span>
              {stats.unrepliedComments > 0 && (
                <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                  {stats.unrepliedComments}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">
              {stats.unrepliedComments > 0 
                ? `${stats.unrepliedComments} comment${stats.unrepliedComments > 1 ? 's' : ''} need reply`
                : 'All caught up!'}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Footer */}
      {totalUnreplied === 0 && (
        <div className="p-4 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-400">You're all caught up! 🎉</p>
        </div>
      )}
    </motion.div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pages, setPages] = useState([]);
  const [selectedPageFilter, setSelectedPageFilter] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    totalPages: 0,
    selectedPages: 0,
    unrepliedComments: 0,
    unrepliedMessages: 0,
    totalConversations: 0,
    totalComments: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'comments', name: 'Comments', icon: MessageSquare, badge: stats.unrepliedComments },
    { id: 'messages', name: 'Messages', icon: MessagesSquare, badge: stats.unrepliedMessages },
    { id: 'pages', name: 'Pages', icon: Layers },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const totalUnreplied = (stats.unrepliedMessages || 0) + (stats.unrepliedComments || 0);

  // Load initial data
  useEffect(() => {
    loadPages();
    loadStats();
    
    // Refresh stats every 2 minutes
    const interval = setInterval(loadStats, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadPages = async () => {
    try {
      const response = await pagesAPI.getPages();
      const pagesData = response.data || [];
      setPages(pagesData);
      setStats(prev => ({
        ...prev,
        totalPages: pagesData.length,
        selectedPages: pagesData.filter((p) => p.isSelected).length,
      }));
    } catch (err) {
      console.error('Failed to load pages:', err);
    }
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await statsAPI.getStats();
      if (response.success && response.data) {
        setStats(prev => ({
          ...prev,
          ...response.data,
        }));
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const updateStats = (pagesData) => {
    setStats(prev => ({
      ...prev,
      totalPages: pagesData.length,
      selectedPages: pagesData.filter((p) => p.isSelected).length,
    }));
  };

  const handlePagesChange = (updatedPages) => {
    setPages(updatedPages);
    updateStats(updatedPages);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview stats={stats} pages={pages} setActiveTab={setActiveTab} />;
      case 'comments':
        return (
          <div className="space-y-6">
            {/* Page filter */}
            <div className="flex items-center gap-4">
              <select
                value={selectedPageFilter || ''}
                onChange={(e) => setSelectedPageFilter(e.target.value || null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:border-brand-500/50"
              >
                <option value="">All Selected Pages</option>
                {pages.filter(p => p.isSelected).map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>
            <CommentsFeed selectedPageId={selectedPageFilter} />
          </div>
        );
      case 'messages':
        return (
          <div className="space-y-6">
            {/* Page filter */}
            <div className="flex items-center gap-4">
              <select
                value={selectedPageFilter || ''}
                onChange={(e) => setSelectedPageFilter(e.target.value || null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:border-brand-500/50"
              >
                <option value="">All Selected Pages</option>
                {pages.filter(p => p.isSelected).map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>
            <MessagesFeed selectedPageId={selectedPageFilter} />
          </div>
        );
      case 'pages':
        return (
          <div className="glass rounded-2xl p-6">
            <PagesManager onPagesChange={handlePagesChange} />
          </div>
        );
      case 'settings':
        return (
          <div className="glass rounded-2xl p-6 space-y-6">
            <h3 className="text-xl font-display font-bold text-white">Settings</h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-medium text-white mb-2">Account</h4>
                <div className="flex items-center gap-4">
                  <img
                    src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0c8de6&color=fff`}
                    alt={user?.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-white">{user?.name}</p>
                    <p className="text-sm text-slate-400">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-medium text-white mb-2">Connected Pages</h4>
                <p className="text-sm text-slate-400">
                  {stats.totalPages} pages connected, {stats.selectedPages} selected
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-medium text-white mb-3">Business Manager</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Connect your Facebook Business Manager to access pages you manage through it.
                </p>
                <BusinessManagerSettings />
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <h4 className="font-medium text-red-400 mb-2">Danger Zone</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Disconnect your account from this app
                </p>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to logout?')) {
                      logout();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 z-40 flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <motion.div 
            className="flex items-center gap-3"
            animate={{ opacity: 1 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <span className="text-xl font-bold text-white">P</span>
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-display font-bold text-white text-lg"
              >
                Pages Manager
              </motion.span>
            )}
          </motion.div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                activeTab === item.id
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {/* Badge for collapsed sidebar */}
                {!sidebarOpen && item.badge > 0 && (
                  <span className={`absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] text-white flex items-center justify-center font-bold ${
                    item.id === 'comments' ? 'bg-orange-500' : 'bg-purple-500'
                  }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left font-medium">{item.name}</span>
                  {/* Badge for expanded sidebar */}
                  {item.badge > 0 && (
                    <span className={`min-w-[20px] h-[20px] px-1.5 rounded-full text-xs text-white flex items-center justify-center font-bold ${
                      item.id === 'comments' ? 'bg-orange-500' : 'bg-purple-500'
                    }`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
              <img
                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0c8de6&color=fff`}
                alt={user?.name}
                className="w-10 h-10 rounded-full ring-2 ring-brand-500/30"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{user?.name}</p>
                <p className="text-sm text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-full p-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 280 : 80 }}
      >
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/30 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-display font-bold text-white capitalize">
              {activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2.5 rounded-xl transition-colors ${
                  showNotifications 
                    ? 'bg-slate-800 text-white' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Bell className="w-5 h-5" />
                {totalUnreplied > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium animate-pulse">
                    {totalUnreplied}
                  </span>
                )}
              </button>
              
              {/* Notifications Popup */}
              <AnimatePresence>
                {showNotifications && (
                  <NotificationsPopup 
                    stats={stats}
                    onNavigate={(tab) => setActiveTab(tab)}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </AnimatePresence>
            </div>
            
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-300">
              <img
                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0c8de6&color=fff`}
                alt={user?.name}
                className="w-8 h-8 rounded-lg"
              />
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ stats, pages, setActiveTab }) => {
  const { user } = useAuth();

  const statCards = [
    { 
      label: 'Total Pages', 
      value: stats.totalPages.toString(), 
      icon: Layers, 
      color: 'brand',
      subtitle: `${stats.selectedPages} selected`,
      action: () => setActiveTab('pages')
    },
    { 
      label: 'Unreplied Comments', 
      value: stats.unrepliedComments?.toString() || '0', 
      icon: MessageSquare, 
      color: 'orange',
      subtitle: 'Needs your attention',
      action: () => setActiveTab('comments')
    },
    { 
      label: 'Unreplied Messages', 
      value: stats.unrepliedMessages?.toString() || '0', 
      icon: MessagesSquare, 
      color: 'purple',
      subtitle: 'Awaiting reply',
      action: () => setActiveTab('messages')
    },
    { 
      label: 'Conversations', 
      value: stats.totalConversations?.toString() || '0', 
      icon: Users, 
      color: 'emerald',
      subtitle: 'Total threads',
      action: () => setActiveTab('messages')
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-400">
          Here's what's happening with your pages today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={stat.action}
            className={`glass rounded-2xl p-6 hover:border-${stat.color}-500/30 transition-colors group text-left w-full`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-500/10 group-hover:bg-${stat.color}-500/20 transition-colors`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
            {stat.subtitle && (
              <div className="text-xs text-slate-500 mt-1">{stat.subtitle}</div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-xl font-display font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setActiveTab('comments')}
            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-brand-500/30 transition-all group"
          >
            <div className="p-3 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
              <MessageSquare className="w-6 h-6 text-orange-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-white">View Comments</div>
              <div className="text-sm text-slate-400">Manage all comments</div>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('pages')}
            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-brand-500/30 transition-all group"
          >
            <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <Layers className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-white">Manage Pages</div>
              <div className="text-sm text-slate-400">{stats.totalPages} pages connected</div>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('messages')}
            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-brand-500/30 transition-all group"
          >
            <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <MessagesSquare className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-left">
              <div className="font-medium text-white">Messages</div>
              <div className="text-sm text-slate-400">View all conversations</div>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Getting Started */}
      {stats.totalPages === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="p-6 rounded-2xl bg-gradient-to-r from-brand-500/10 to-purple-500/10 border border-brand-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-500/20">
              <RefreshCw className="w-6 h-6 text-brand-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-white mb-1">
                Get Started
              </h3>
              <p className="text-slate-400 text-sm">
                Sync your Facebook pages to start managing comments and engagement from one place.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('pages')}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors"
            >
              Sync Pages
            </button>
          </div>
        </motion.div>
      )}

      {/* Selected Pages Preview */}
      {pages.filter(p => p.isSelected).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-white">Selected Pages</h2>
            <button
              onClick={() => setActiveTab('pages')}
              className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              Manage →
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {pages.filter(p => p.isSelected).slice(0, 8).map((page) => (
              <div
                key={page.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50"
              >
                <img
                  src={page.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(page.name)}&background=0c8de6&color=fff&size=32`}
                  alt={page.name}
                  className="w-6 h-6 rounded"
                />
                <span className="text-sm text-white">{page.name}</span>
              </div>
            ))}
            {pages.filter(p => p.isSelected).length > 8 && (
              <div className="flex items-center px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-sm text-slate-400">
                  +{pages.filter(p => p.isSelected).length - 8} more
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;

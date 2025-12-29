import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Check,
  X,
  Search,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  Users,
  ExternalLink,
} from 'lucide-react';
import { pagesAPI } from '../services/api';

const PagesManager = ({ onPagesChange }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load pages on mount
  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pagesAPI.getPages();
      setPages(response.data || []);
      if (onPagesChange) {
        onPagesChange(response.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const syncPages = async () => {
    try {
      setSyncing(true);
      setError(null);
      const response = await pagesAPI.syncPages();
      setPages(response.data || []);
      if (onPagesChange) {
        onPagesChange(response.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const togglePageSelection = async (pageId) => {
    try {
      const response = await pagesAPI.togglePageSelection(pageId);
      setPages((prev) =>
        prev.map((p) => (p.id === pageId ? response.data : p))
      );
      if (onPagesChange) {
        const updatedPages = pages.map((p) =>
          p.id === pageId ? response.data : p
        );
        onPagesChange(updatedPages);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const selectAll = async () => {
    try {
      const response = await pagesAPI.selectAll();
      setPages(response.data || []);
      if (onPagesChange) {
        onPagesChange(response.data || []);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deselectAll = async () => {
    try {
      const response = await pagesAPI.deselectAll();
      setPages(response.data || []);
      if (onPagesChange) {
        onPagesChange(response.data || []);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = pages.filter((p) => p.isSelected).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Your Pages</h3>
          <p className="text-sm text-slate-400">
            {selectedCount} of {pages.length} pages selected
          </p>
        </div>
        <button
          onClick={syncPages}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync from Facebook'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* No pages */}
      {pages.length === 0 && !error && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-white mb-2">No pages found</h4>
          <p className="text-slate-400 mb-4">
            Sync your Facebook pages to get started
          </p>
          <button
            onClick={syncPages}
            disabled={syncing}
            className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors"
          >
            {syncing ? 'Syncing...' : 'Sync Pages'}
          </button>
        </div>
      )}

      {/* Pages list */}
      {pages.length > 0 && (
        <>
          {/* Search and bulk actions */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
              />
            </div>
            <button
              onClick={selectAll}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              All
            </button>
            <button
              onClick={deselectAll}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm transition-colors"
            >
              <Square className="w-4 h-4" />
              None
            </button>
          </div>

          {/* Pages grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
            <AnimatePresence>
              {filteredPages.map((page, index) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => togglePageSelection(page.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    page.isSelected
                      ? 'bg-brand-500/10 border border-brand-500/30'
                      : 'bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50'
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                      page.isSelected
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>

                  {/* Page picture */}
                  <img
                    src={page.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(page.name)}&background=0c8de6&color=fff`}
                    alt={page.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />

                  {/* Page info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{page.name}</h4>
                    <p className="text-xs text-slate-400 truncate">
                      {page.category || 'Page'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};

export default PagesManager;


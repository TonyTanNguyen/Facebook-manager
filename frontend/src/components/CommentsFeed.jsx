import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Send,
  Heart,
  EyeOff,
  Eye,
  Trash2,
  MessageCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Image,
} from 'lucide-react';
import { commentsAPI } from '../services/api';

const CommentCard = ({ comment, onReply, onLike, onHide, onDelete }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      await onReply(comment.id, replyText, comment.page.id);
      setReplyText('');
      setShowReplyInput(false);
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setIsReplying(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 hover:border-slate-600/50 transition-colors"
    >
      {/* Post context */}
      <div className="flex items-start gap-3 pb-3 mb-3 border-b border-slate-700/50">
        {/* Page avatar */}
        <img
          src={comment.page.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.page.name)}&background=0c8de6&color=fff`}
          alt={comment.page.name}
          className="w-8 h-8 rounded-lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-brand-400 truncate">
              {comment.page.name}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(comment.post.created_time)}
            </span>
          </div>
          {comment.post.message && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
              {comment.post.message}
            </p>
          )}
        </div>
        {comment.post.picture && (
          <img
            src={comment.post.picture}
            alt="Post"
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        {comment.post.permalink && (
          <a
            href={comment.post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Comment */}
      <div className="flex items-start gap-3">
        {/* Commenter avatar */}
        <img
          src={comment.from?.picture?.data?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.from?.name || 'User')}&background=6366f1&color=fff`}
          alt={comment.from?.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">
              {comment.from?.name || 'Unknown User'}
            </span>
            <span className="text-xs text-slate-500">
              {formatDate(comment.created_time)}
            </span>
            {comment.is_hidden && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                Hidden
              </span>
            )}
          </div>
          <p className="text-slate-300 whitespace-pre-wrap break-words">
            {comment.message}
          </p>

          {/* Comment attachment */}
          {comment.attachment && (
            <div className="mt-2">
              {comment.attachment.media?.image && (
                <img
                  src={comment.attachment.media.image.src}
                  alt="Attachment"
                  className="max-w-xs rounded-lg"
                />
              )}
            </div>
          )}

          {/* Comment stats */}
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            {comment.like_count > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {comment.like_count}
              </span>
            )}
            {comment.comment_count > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {comment.comment_count} replies
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Reply
            </button>
            <button
              onClick={() => onLike(comment.id, comment.page.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm transition-colors"
            >
              <Heart className="w-4 h-4" />
              Like
            </button>
            <button
              onClick={() => onHide(comment.id, comment.page.id, comment.is_hidden)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-sm transition-colors"
            >
              {comment.is_hidden ? (
                <>
                  <Eye className="w-4 h-4" />
                  Show
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide
                </>
              )}
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this comment?')) {
                  onDelete(comment.id, comment.page.id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-red-500/20 text-slate-300 hover:text-red-400 text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || isReplying}
                  className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-50"
                >
                  {isReplying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const CommentsFeed = ({ selectedPageId, dateRange }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'unreplied'

  const loadComments = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = {};
      if (selectedPageId) {
        params.pageId = selectedPageId;
      }
      if (dateRange?.startDate) {
        params.startDate = dateRange.startDate;
      }
      if (dateRange?.endDate) {
        params.endDate = dateRange.endDate;
      }

      const response = await commentsAPI.getComments(params);
      setComments(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPageId, dateRange]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleReply = async (commentId, message, pageId) => {
    await commentsAPI.replyToComment(commentId, message, pageId);
    // Optionally refresh comments
  };

  const handleLike = async (commentId, pageId) => {
    try {
      await commentsAPI.likeComment(commentId, pageId);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleHide = async (commentId, pageId, isHidden) => {
    try {
      if (isHidden) {
        await commentsAPI.unhideComment(commentId, pageId);
      } else {
        await commentsAPI.hideComment(commentId, pageId);
      }
      // Update local state
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, is_hidden: !isHidden } : c
        )
      );
    } catch (err) {
      console.error('Hide/unhide failed:', err);
    }
  };

  const handleDelete = async (commentId, pageId) => {
    try {
      await commentsAPI.deleteComment(commentId, pageId);
      // Remove from local state
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Filter comments based on selected filter
  // A comment is considered "unreplied" if it has no replies (comment_count === 0)
  const filteredComments = filter === 'unreplied'
    ? comments.filter(c => !c.comment_count || c.comment_count === 0)
    : comments;

  const unrepliedCount = comments.filter(c => !c.comment_count || c.comment_count === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-slate-400">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Comments</h3>
          <p className="text-sm text-slate-400">
            {filteredComments.length} of {comments.length} comments from your pages
          </p>
        </div>
        <button
          onClick={() => loadComments(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-brand-500 text-white'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unreplied')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            filter === 'unreplied'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Needs Reply
          {unrepliedCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              filter === 'unreplied' ? 'bg-white/20' : 'bg-orange-500/20 text-orange-400'
            }`}>
              {unrepliedCount}
            </span>
          )}
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
          <div>
            <p className="text-red-400 text-sm font-medium">Failed to load comments</p>
            <p className="text-red-400/70 text-sm mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* No comments */}
      {filteredComments.length === 0 && !error && (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-white mb-2">
            {filter === 'unreplied' ? 'All caught up!' : 'No comments yet'}
          </h4>
          <p className="text-slate-400">
            {filter === 'unreplied' 
              ? 'All comments have been replied to'
              : 'Comments from your selected pages will appear here'}
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onLike={handleLike}
              onHide={handleHide}
              onDelete={handleDelete}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommentsFeed;


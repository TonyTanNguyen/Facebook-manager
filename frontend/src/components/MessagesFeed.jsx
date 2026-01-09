import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Send,
  MessageCircle,
  User,
  Clock,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Check,
  CheckCheck,
} from "lucide-react";
import { messagesAPI } from "../services/api";

// Conversation List Item
const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const participant = conversation.participants?.data?.find(
    (p) => p.id !== conversation.page?.facebookPageId
  );
  const lastMessage = conversation.messages?.data?.[0];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`flex items-start gap-3 p-4 cursor-pointer transition-all border-b border-slate-800/50 ${
        isSelected
          ? "bg-brand-500/10 border-l-2 border-l-brand-500"
          : "hover:bg-slate-800/30"
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
            participant?.name || "User"
          )}&background=6366f1&color=fff`}
          alt={participant?.name}
          className="w-12 h-12 rounded-full"
        />
        {conversation.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full text-xs text-white flex items-center justify-center">
            {conversation.unread_count}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-white truncate">
            {participant?.name || "Unknown User"}
          </span>
          <span className="text-xs text-slate-500">
            {formatDate(conversation.updated_time)}
          </span>
        </div>
        <p className="text-sm text-slate-400 truncate">
          {conversation.snippet || lastMessage?.message || "No messages"}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-brand-400 truncate">
            {conversation.page?.name}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Message Bubble
const MessageBubble = ({ message, isOwn, pageName }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[70%] ${
          isOwn
            ? "bg-brand-500 text-white rounded-2xl rounded-br-md"
            : "bg-slate-800 text-white rounded-2xl rounded-bl-md"
        } px-4 py-2.5`}
      >
        {!isOwn && (
          <p className="text-xs text-slate-400 mb-1">{message.from?.name}</p>
        )}
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
        <div
          className={`flex items-center justify-end gap-1 mt-1 ${
            isOwn ? "text-white/70" : "text-slate-500"
          }`}
        >
          <span className="text-xs">{formatTime(message.created_time)}</span>
          {isOwn && <CheckCheck className="w-3.5 h-3.5" />}
        </div>
      </div>
    </motion.div>
  );
};

// Conversation Detail View
const ConversationDetail = ({
  conversation,
  onBack,
  onSendMessage,
}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const participant = conversation?.participants?.data?.find(
    (p) => p.id !== conversation.page?.facebookPageId
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (conversation) {
      loadMessages();
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getConversationMessages(
        conversation.id,
        conversation.page.facebookPageId
      );
      // Reverse to show oldest first
      setMessages((response.data || []).reverse());
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(
        conversation.id,
        newMessage,
        conversation.page.facebookPageId,
        participant?.id
      );
      setNewMessage("");
      // Reload messages to show the sent one
      await loadMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors md:hidden"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
            participant?.name || "User"
          )}&background=6366f1&color=fff`}
          alt={participant?.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">
            {participant?.name || "Unknown User"}
          </h3>
          <p className="text-xs text-slate-400 truncate">
            via {conversation.page?.name}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400">No messages yet</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.from?.id === conversation.page?.facebookPageId}
                pageName={conversation.page?.name}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="p-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Messages Feed Component
const MessagesFeed = ({ selectedPageId, dateRange }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'unreplied'

  const loadConversations = useCallback(
    async (showRefreshing = false) => {
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

        const response = await messagesAPI.getConversations(params);
        setConversations(response.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedPageId, dateRange]
  );

  useEffect(() => {
    loadConversations();
    // Clear selected conversation when page changes
    setSelectedConversation(null);
  }, [loadConversations]);

  const handleSendMessage = async (conversationId, message, pageId, recipientId) => {
    await messagesAPI.sendMessage(conversationId, message, pageId, recipientId);
  };

  // Check if a conversation needs a reply (last message is from customer, not from page)
  const isUnreplied = (conv) => {
    const lastMessage = conv.messages?.data?.[0];
    if (!lastMessage) return false;
    // If last message sender is not the page, it needs a reply
    return lastMessage.from?.id !== conv.page?.facebookPageId;
  };

  // Filter conversations based on selected filter
  const filteredConversations = filter === 'unreplied'
    ? conversations.filter(conv => isUnreplied(conv))
    : conversations;

  const unrepliedCount = conversations.filter(conv => isUnreplied(conv)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-slate-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
      <div className="flex h-full">
        {/* Conversations List */}
        <div
          className={`w-full md:w-96 border-r border-slate-800 flex flex-col ${
            selectedConversation ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Messages</h3>
                <p className="text-sm text-slate-400">
                  {filteredConversations.length} of {conversations.length} conversations
                </p>
              </div>
              <button
                onClick={() => loadConversations(true)}
                disabled={refreshing}
                className="p-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
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
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Needs Reply
                {unrepliedCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    filter === 'unreplied' ? 'bg-white/20' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {unrepliedCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 && !error ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageCircle className="w-12 h-12 text-slate-600 mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">
                  {filter === 'unreplied' ? 'All caught up!' : 'No messages yet'}
                </h4>
                <p className="text-slate-400 text-sm">
                  {filter === 'unreplied' 
                    ? 'All messages have been replied to!' 
                    : 'Messages from your selected pages will appear here'}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedConversation?.id === conv.id}
                    onClick={() => setSelectedConversation(conv)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Conversation Detail */}
        <div
          className={`flex-1 ${
            selectedConversation ? "flex" : "hidden md:flex"
          } flex-col`}
        >
          {selectedConversation ? (
            <ConversationDetail
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-slate-600" />
              </div>
              <h4 className="text-xl font-medium text-white mb-2">
                Select a conversation
              </h4>
              <p className="text-slate-400">
                Choose a conversation from the list to view messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesFeed;


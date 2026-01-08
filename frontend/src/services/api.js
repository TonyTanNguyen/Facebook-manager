const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Generic fetch wrapper with error handling
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        // Token expired or invalid
        if (data.code === "TOKEN_EXPIRED" || data.code === "FB_TOKEN_EXPIRED") {
          localStorage.removeItem("token");
          window.location.href = "/login?error=session_expired";
        }
      }
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// Auth API endpoints
export const authAPI = {
  // Get Facebook OAuth URL
  getLoginUrl: () => {
    return `${API_BASE_URL}/auth/facebook`;
  },

  // Get current user info
  getMe: () => fetchAPI("/auth/me"),

  // Check auth status
  getStatus: () => fetchAPI("/auth/status"),

  // Logout
  logout: () => fetchAPI("/auth/logout", { method: "POST" }),

  // Refresh token
  refreshToken: () => fetchAPI("/auth/refresh", { method: "POST" }),

  // Delete account
  deleteAccount: () => fetchAPI("/auth/account", { method: "DELETE" }),
};

// Pages API endpoints
export const pagesAPI = {
  // Get all user's pages
  getPages: () => fetchAPI("/pages"),

  // Sync pages from Facebook
  syncPages: () => fetchAPI("/pages/sync", { method: "POST" }),

  // Get selected pages
  getSelectedPages: () => fetchAPI("/pages/selected"),

  // Toggle page selection
  togglePageSelection: (pageId) =>
    fetchAPI(`/pages/${pageId}/select`, { method: "PUT" }),

  // Bulk update page selections
  updatePageSelection: (selectedIds) =>
    fetchAPI("/pages/selection", {
      method: "PUT",
      body: JSON.stringify({ selectedIds }),
    }),

  // Select all pages
  selectAll: () => fetchAPI("/pages/select-all", { method: "POST" }),

  // Deselect all pages
  deselectAll: () => fetchAPI("/pages/deselect-all", { method: "POST" }),
};

// Comments API endpoints
export const commentsAPI = {
  // Get comments for selected pages
  getComments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/comments${query ? `?${query}` : ""}`);
  },

  // Reply to a comment
  replyToComment: (commentId, message, pageId) =>
    fetchAPI(`/comments/${commentId}/reply`, {
      method: "POST",
      body: JSON.stringify({ message, pageId }),
    }),

  // Like a comment
  likeComment: (commentId, pageId) =>
    fetchAPI(`/comments/${commentId}/like`, {
      method: "POST",
      body: JSON.stringify({ pageId }),
    }),

  // Unlike a comment
  unlikeComment: (commentId, pageId) =>
    fetchAPI(`/comments/${commentId}/like`, {
      method: "DELETE",
      body: JSON.stringify({ pageId }),
    }),

  // Hide a comment
  hideComment: (commentId, pageId) =>
    fetchAPI(`/comments/${commentId}/hide`, {
      method: "POST",
      body: JSON.stringify({ pageId }),
    }),

  // Unhide a comment
  unhideComment: (commentId, pageId) =>
    fetchAPI(`/comments/${commentId}/unhide`, {
      method: "POST",
      body: JSON.stringify({ pageId }),
    }),

  // Delete a comment
  deleteComment: (commentId, pageId) =>
    fetchAPI(`/comments/${commentId}`, {
      method: "DELETE",
      body: JSON.stringify({ pageId }),
    }),
};

// Messages API endpoints
export const messagesAPI = {
  // Get all conversations from selected pages
  getConversations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/messages${query ? `?${query}` : ""}`);
  },

  // Get messages in a conversation
  getConversationMessages: (conversationId, pageId) =>
    fetchAPI(`/messages/conversation/${conversationId}?pageId=${pageId}`),

  // Send a message in a conversation
  sendMessage: (conversationId, message, pageId, recipientId) =>
    fetchAPI(`/messages/conversation/${conversationId}/send`, {
      method: "POST",
      body: JSON.stringify({ message, pageId, recipientId }),
    }),

  // Mark conversation as read
  markAsRead: (conversationId, pageId) =>
    fetchAPI(`/messages/conversation/${conversationId}/read`, {
      method: "POST",
      body: JSON.stringify({ pageId }),
    }),
};

// Stats API endpoints
export const statsAPI = {
  // Get full engagement stats
  getStats: () => fetchAPI("/stats"),

  // Get quick stats (just unread count - faster)
  getQuickStats: () => fetchAPI("/stats/quick"),
};

// Business Manager API endpoints
export const businessManagerAPI = {
  // Get connected Business Manager
  get: () => fetchAPI("/business-manager"),

  // Connect Business Manager with System User token
  connect: (systemUserToken, businessId, businessName) =>
    fetchAPI("/business-manager/connect", {
      method: "POST",
      body: JSON.stringify({ systemUserToken, businessId, businessName }),
    }),

  // Disconnect Business Manager
  disconnect: () =>
    fetchAPI("/business-manager/disconnect", { method: "DELETE" }),

  // Validate token
  validate: () =>
    fetchAPI("/business-manager/validate", { method: "POST" }),

  // Get pages from Business Manager (preview)
  getPages: () => fetchAPI("/business-manager/pages"),
};

export default {
  auth: authAPI,
  pages: pagesAPI,
  comments: commentsAPI,
  messages: messagesAPI,
  stats: statsAPI,
  businessManager: businessManagerAPI,
};

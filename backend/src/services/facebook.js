/**
 * Facebook Graph API Service
 * Handles all interactions with Facebook's Graph API
 */

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

/**
 * Make a request to Facebook Graph API
 */
const graphRequest = async (endpoint, accessToken, options = {}) => {
  const url = new URL(`${GRAPH_API_BASE}${endpoint}`);
  url.searchParams.append("access_token", accessToken);

  // Add any additional query params
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();

  if (data.error) {
    const error = new Error(data.error.message);
    error.code = data.error.code;
    error.type = data.error.type;
    throw error;
  }

  return data;
};

/**
 * Get all pages the user has access to
 */
export const getUserPages = async (userAccessToken) => {
  const data = await graphRequest("/me/accounts", userAccessToken, {
    params: {
      fields:
        "id,name,category,picture{url},access_token,fan_count,followers_count,tasks",
      limit: 100,
    },
  });

  // Log pages and their tasks for debugging
  if (data.data) {
    data.data.forEach(page => {
      console.log(`Page: ${page.name}, Tasks: ${JSON.stringify(page.tasks || 'No tasks returned')}`);
    });
  }

  return data.data || [];
};

/**
 * Get page details
 */
export const getPageDetails = async (pageId, pageAccessToken) => {
  return graphRequest(`/${pageId}`, pageAccessToken, {
    params: {
      fields: "id,name,category,picture{url},fan_count,followers_count,about",
    },
  });
};

/**
 * Get posts from a page
 */
export const getPagePosts = async (pageId, pageAccessToken, limit = 25) => {
  const data = await graphRequest(`/${pageId}/posts`, pageAccessToken, {
    params: {
      fields:
        "id,message,created_time,full_picture,permalink_url,shares,likes.summary(true),comments.summary(true)",
      limit,
    },
  });

  return data.data || [];
};

/**
 * Get comments on a post
 */
export const getPostComments = async (postId, pageAccessToken, limit = 50) => {
  const data = await graphRequest(`/${postId}/comments`, pageAccessToken, {
    params: {
      fields:
        "id,message,created_time,from{id,name,picture},like_count,comment_count,is_hidden,can_hide,can_remove,parent,attachment",
      order: "reverse_chronological",
      limit,
    },
  });

  return data.data || [];
};

/**
 * Get all comments from multiple pages (aggregated)
 */
export const getCommentsFromPages = async (pages, limit = 50) => {
  const allComments = [];

  for (const page of pages) {
    try {
      // Get recent posts from the page
      const posts = await getPagePosts(
        page.facebookPageId,
        page.pageAccessToken,
        10
      );

      for (const post of posts) {
        // Get comments for each post
        const comments = await getPostComments(
          post.id,
          page.pageAccessToken,
          limit
        );

        // Add page and post context to each comment
        const enrichedComments = comments.map((comment) => ({
          ...comment,
          page: {
            id: page.facebookPageId,
            name: page.name,
            picture: page.picture,
          },
          post: {
            id: post.id,
            message: post.message,
            picture: post.full_picture,
            permalink: post.permalink_url,
            created_time: post.created_time,
          },
        }));

        allComments.push(...enrichedComments);
      }
    } catch (error) {
      console.error(
        `Error fetching comments for page ${page.name}:`,
        error.message
      );
    }
  }

  // Sort all comments by date (newest first)
  allComments.sort(
    (a, b) => new Date(b.created_time) - new Date(a.created_time)
  );

  return allComments.slice(0, limit);
};

/**
 * Reply to a comment
 */
export const replyToComment = async (commentId, message, pageAccessToken) => {
  return graphRequest(`/${commentId}/comments`, pageAccessToken, {
    method: "POST",
    params: {
      message,
    },
  });
};

/**
 * Like a comment
 */
export const likeComment = async (commentId, pageAccessToken) => {
  return graphRequest(`/${commentId}/likes`, pageAccessToken, {
    method: "POST",
  });
};

/**
 * Unlike a comment
 */
export const unlikeComment = async (commentId, pageAccessToken) => {
  return graphRequest(`/${commentId}/likes`, pageAccessToken, {
    method: "DELETE",
  });
};

/**
 * Hide a comment
 */
export const hideComment = async (commentId, pageAccessToken) => {
  return graphRequest(`/${commentId}`, pageAccessToken, {
    method: "POST",
    params: {
      is_hidden: true,
    },
  });
};

/**
 * Unhide a comment
 */
export const unhideComment = async (commentId, pageAccessToken) => {
  return graphRequest(`/${commentId}`, pageAccessToken, {
    method: "POST",
    params: {
      is_hidden: false,
    },
  });
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId, pageAccessToken) => {
  return graphRequest(`/${commentId}`, pageAccessToken, {
    method: "DELETE",
  });
};

/**
 * Get conversations (messages) from a page
 */
export const getPageConversations = async (
  pageId,
  pageAccessToken,
  limit = 25
) => {
  const data = await graphRequest(`/${pageId}/conversations`, pageAccessToken, {
    params: {
      fields:
        "id,participants,updated_time,message_count,unread_count,snippet,messages.limit(1){id,message,created_time,from}",
      limit,
    },
  });

  return data.data || [];
};

/**
 * Get all conversations from multiple pages (aggregated)
 */
export const getConversationsFromPages = async (pages, limit = 50) => {
  const allConversations = [];

  for (const page of pages) {
    try {
      const conversations = await getPageConversations(
        page.facebookPageId,
        page.pageAccessToken,
        limit
      );

      // Add page context to each conversation
      const enrichedConversations = conversations.map((conv) => ({
        ...conv,
        page: {
          id: page.id,
          facebookPageId: page.facebookPageId,
          name: page.name,
          picture: page.picture,
        },
      }));

      allConversations.push(...enrichedConversations);
    } catch (error) {
      console.error(
        `Error fetching conversations for page ${page.name}:`,
        error.message
      );
    }
  }

  // Sort by updated_time (newest first)
  allConversations.sort(
    (a, b) => new Date(b.updated_time) - new Date(a.updated_time)
  );

  return allConversations.slice(0, limit);
};

/**
 * Get messages in a conversation
 */
export const getConversationMessages = async (
  conversationId,
  pageAccessToken,
  limit = 50
) => {
  const data = await graphRequest(
    `/${conversationId}/messages`,
    pageAccessToken,
    {
      params: {
        fields:
          "id,message,created_time,from,to,attachments{id,mime_type,name,size,image_data}",
        limit,
      },
    }
  );

  return data.data || [];
};

/**
 * Send a message to a user (using their PSID - Page Scoped ID)
 */
export const sendMessage = async (recipientId, message, pageAccessToken) => {
  return graphRequest(`/me/messages`, pageAccessToken, {
    method: "POST",
    params: {
      recipient: JSON.stringify({ id: recipientId }),
      message: JSON.stringify({ text: message }),
      messaging_type: "RESPONSE",
    },
  });
};

/**
 * Mark a conversation as read
 */
export const markConversationRead = async (conversationId, pageAccessToken) => {
  return graphRequest(`/${conversationId}`, pageAccessToken, {
    method: "POST",
    params: {
      is_read: true,
    },
  });
};

// ==========================================
// Business Manager Functions
// ==========================================

/**
 * Validate a System User token by fetching user info
 */
export const validateSystemUserToken = async (systemUserToken) => {
  const data = await graphRequest("/me", systemUserToken, {
    params: {
      fields: "id,name",
    },
  });
  return data;
};

/**
 * Get businesses accessible by the System User token
 */
export const getBusinesses = async (systemUserToken) => {
  // First try to get the System User's info which includes their business
  try {
    const meData = await graphRequest("/me", systemUserToken, {
      params: {
        fields: "id,name,business",
      },
    });
    console.log("System User /me response:", JSON.stringify(meData, null, 2));

    // If the System User has a business directly attached
    if (meData.business) {
      return [meData.business];
    }
  } catch (error) {
    console.error("Error fetching /me:", error.message);
  }

  // Fallback to /me/businesses
  const data = await graphRequest("/me/businesses", systemUserToken, {
    params: {
      fields: "id,name,created_time",
      limit: 100,
    },
  });
  console.log("System User /me/businesses response:", JSON.stringify(data, null, 2));
  return data.data || [];
};

/**
 * Get pages owned by a Business Manager
 */
export const getBusinessOwnedPages = async (businessId, systemUserToken) => {
  const data = await graphRequest(`/${businessId}/owned_pages`, systemUserToken, {
    params: {
      fields: "id,name,category,picture{url},access_token,fan_count,followers_count",
      limit: 100,
    },
  });

  // Log pages for debugging
  if (data.data) {
    console.log(`Business Manager ${businessId} pages:`);
    data.data.forEach(page => {
      console.log(`  - ${page.name} (${page.id})`);
    });
  }

  return data.data || [];
};

/**
 * Get pages that the Business has client access to
 */
export const getBusinessClientPages = async (businessId, systemUserToken) => {
  try {
    const data = await graphRequest(`/${businessId}/client_pages`, systemUserToken, {
      params: {
        fields: "id,name,category,picture{url},access_token,fan_count,followers_count",
        limit: 100,
      },
    });
    return data.data || [];
  } catch (error) {
    // client_pages endpoint may not be available for all business types
    console.log(`No client pages for business ${businessId}:`, error.message);
    return [];
  }
};

/**
 * Get all pages from Business Manager (owned + client)
 */
export const getAllBusinessPages = async (businessId, systemUserToken) => {
  const [ownedPages, clientPages] = await Promise.all([
    getBusinessOwnedPages(businessId, systemUserToken),
    getBusinessClientPages(businessId, systemUserToken),
  ]);

  // Combine and deduplicate by page ID
  const allPages = [...ownedPages];
  const existingIds = new Set(ownedPages.map(p => p.id));

  for (const page of clientPages) {
    if (!existingIds.has(page.id)) {
      allPages.push(page);
    }
  }

  return allPages;
};

export default {
  getUserPages,
  getPageDetails,
  getPagePosts,
  getPostComments,
  getCommentsFromPages,
  replyToComment,
  likeComment,
  unlikeComment,
  hideComment,
  unhideComment,
  deleteComment,
  getPageConversations,
  getConversationsFromPages,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  // Business Manager functions
  validateSystemUserToken,
  getBusinesses,
  getBusinessOwnedPages,
  getBusinessClientPages,
  getAllBusinessPages,
};

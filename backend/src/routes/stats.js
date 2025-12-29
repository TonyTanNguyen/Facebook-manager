import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Page } from "../models/index.js";
import {
  getPageConversations,
  getPagePosts,
  getPostComments,
} from "../services/facebook.js";

const router = express.Router();

/**
 * @route   GET /api/stats
 * @desc    Get engagement stats (unreplied messages and comments count)
 * @access  Private
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const pages = await Page.findAll({
      where: {
        userId: req.user.id,
        isSelected: true,
      },
    });

    if (pages.length === 0) {
      return res.json({
        success: true,
        data: {
          unrepliedMessages: 0,
          unrepliedComments: 0,
          totalConversations: 0,
          totalComments: 0,
          totalPages: 0,
          selectedPages: 0,
        },
      });
    }

    let unrepliedMessages = 0;
    let totalConversations = 0;
    let unrepliedComments = 0;
    let totalComments = 0;

    // Get stats from each page
    for (const page of pages) {
      try {
        // Get conversations and count unreplied (last message from customer)
        const conversations = await getPageConversations(
          page.facebookPageId,
          page.pageAccessToken,
          50
        );

        totalConversations += conversations.length;

        // Count unreplied conversations (last message is from customer, not page)
        for (const conv of conversations) {
          const lastMessage = conv.messages?.data?.[0];
          if (lastMessage && lastMessage.from?.id !== page.facebookPageId) {
            unrepliedMessages++;
          }
        }

        // Get recent posts and count unreplied comments
        const posts = await getPagePosts(
          page.facebookPageId,
          page.pageAccessToken,
          10
        );

        for (const post of posts) {
          try {
            const comments = await getPostComments(
              post.id,
              page.pageAccessToken,
              50
            );

            totalComments += comments.length;

            // Count comments that have no replies (comment_count === 0 or undefined)
            for (const comment of comments) {
              if (!comment.comment_count || comment.comment_count === 0) {
                unrepliedComments++;
              }
            }
          } catch (err) {
            // Skip if can't get comments for a post
          }
        }
      } catch (err) {
        console.error(
          `Error getting stats for page ${page.name}:`,
          err.message
        );
      }
    }

    // Get total pages count
    const allPages = await Page.findAll({
      where: { userId: req.user.id },
    });

    res.json({
      success: true,
      data: {
        unrepliedMessages,
        unrepliedComments,
        totalConversations,
        totalComments,
        totalPages: allPages.length,
        selectedPages: pages.length,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch stats",
    });
  }
});

/**
 * @route   GET /api/stats/quick
 * @desc    Get quick stats (just unread message count - faster)
 * @access  Private
 */
router.get("/quick", authenticateToken, async (req, res) => {
  try {
    const pages = await Page.findAll({
      where: {
        userId: req.user.id,
        isSelected: true,
      },
    });

    let unreadMessages = 0;

    // Only get unread message count (faster)
    for (const page of pages) {
      try {
        const conversations = await getPageConversations(
          page.facebookPageId,
          page.pageAccessToken,
          25
        );

        for (const conv of conversations) {
          if (conv.unread_count) {
            unreadMessages += conv.unread_count;
          }
        }
      } catch (err) {
        // Skip errors
      }
    }

    res.json({
      success: true,
      data: {
        unreadMessages,
      },
    });
  } catch (error) {
    console.error("Get quick stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quick stats",
    });
  }
});

export default router;

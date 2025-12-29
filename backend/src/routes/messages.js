import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Page } from "../models/index.js";
import {
  getConversationsFromPages,
  getConversationMessages,
  sendMessage,
  markConversationRead,
} from "../services/facebook.js";

const router = express.Router();

/**
 * @route   GET /api/messages
 * @desc    Get all conversations from selected pages
 * @access  Private
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { pageId, limit = 50 } = req.query;

    // Build query for pages
    const pageQuery = {
      userId: req.user.id,
      isSelected: true,
    };

    // Filter by specific page if provided
    if (pageId) {
      pageQuery.id = pageId;
    }

    const pages = await Page.findAll({ where: pageQuery });

    if (pages.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No selected pages found. Please select pages first.",
      });
    }

    // Fetch conversations from Facebook
    const conversations = await getConversationsFromPages(
      pages,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: conversations,
      meta: {
        totalPages: pages.length,
        totalConversations: conversations.length,
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch messages",
    });
  }
});

/**
 * @route   GET /api/messages/conversation/:conversationId
 * @desc    Get messages in a specific conversation
 * @access  Private
 */
router.get(
  "/conversation/:conversationId",
  authenticateToken,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { pageId, limit = 50 } = req.query;

      if (!pageId) {
        return res.status(400).json({
          success: false,
          message: "Page ID is required",
        });
      }

      // Get the page to use its access token
      const page = await Page.findOne({
        where: {
          facebookPageId: pageId,
          userId: req.user.id,
        },
      });

      if (!page) {
        return res.status(404).json({
          success: false,
          message: "Page not found",
        });
      }

      // Fetch messages from Facebook
      const messages = await getConversationMessages(
        conversationId,
        page.pageAccessToken,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("Get conversation messages error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch conversation messages",
      });
    }
  }
);

/**
 * @route   POST /api/messages/conversation/:conversationId/send
 * @desc    Send a message in a conversation
 * @access  Private
 */
router.post(
  "/conversation/:conversationId/send",
  authenticateToken,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { message, pageId, recipientId } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message is required",
        });
      }

      if (!pageId) {
        return res.status(400).json({
          success: false,
          message: "Page ID is required",
        });
      }

      if (!recipientId) {
        return res.status(400).json({
          success: false,
          message: "Recipient ID is required",
        });
      }

      // Get the page to use its access token
      const page = await Page.findOne({
        where: {
          facebookPageId: pageId,
          userId: req.user.id,
        },
      });

      if (!page) {
        return res.status(404).json({
          success: false,
          message: "Page not found",
        });
      }

      // Send the message
      const result = await sendMessage(
        recipientId,
        message.trim(),
        page.pageAccessToken
      );

      res.json({
        success: true,
        data: result,
        message: "Message sent successfully",
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to send message",
      });
    }
  }
);

/**
 * @route   POST /api/messages/conversation/:conversationId/read
 * @desc    Mark a conversation as read
 * @access  Private
 */
router.post(
  "/conversation/:conversationId/read",
  authenticateToken,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { pageId } = req.body;

      if (!pageId) {
        return res.status(400).json({
          success: false,
          message: "Page ID is required",
        });
      }

      const page = await Page.findOne({
        where: {
          facebookPageId: pageId,
          userId: req.user.id,
        },
      });

      if (!page) {
        return res.status(404).json({
          success: false,
          message: "Page not found",
        });
      }

      await markConversationRead(conversationId, page.pageAccessToken);

      res.json({
        success: true,
        message: "Conversation marked as read",
      });
    } catch (error) {
      console.error("Mark conversation read error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to mark conversation as read",
      });
    }
  }
);

export default router;

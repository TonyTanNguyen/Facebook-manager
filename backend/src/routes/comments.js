import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Page } from "../models/index.js";
import {
  getCommentsFromPages,
  replyToComment,
  likeComment,
  unlikeComment,
  hideComment,
  unhideComment,
  deleteComment,
} from "../services/facebook.js";

const router = express.Router();

/**
 * @route   GET /api/comments
 * @desc    Get comments from all selected pages
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

    // Fetch comments from Facebook
    const comments = await getCommentsFromPages(pages, parseInt(limit));

    res.json({
      success: true,
      data: comments,
      meta: {
        totalPages: pages.length,
        totalComments: comments.length,
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch comments",
    });
  }
});

/**
 * @route   POST /api/comments/:commentId/reply
 * @desc    Reply to a comment
 * @access  Private
 */
router.post("/:commentId/reply", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { message, pageId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required",
      });
    }

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

    // Reply to the comment
    const reply = await replyToComment(
      commentId,
      message.trim(),
      page.pageAccessToken
    );

    res.json({
      success: true,
      data: reply,
      message: "Reply posted successfully",
    });
  } catch (error) {
    console.error("Reply to comment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to post reply",
    });
  }
});

/**
 * @route   POST /api/comments/:commentId/like
 * @desc    Like a comment
 * @access  Private
 */
router.post("/:commentId/like", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { pageId } = req.body;

    const page = await Page.findOne({
      where: { facebookPageId: pageId, userId: req.user.id },
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    await likeComment(commentId, page.pageAccessToken);

    res.json({
      success: true,
      message: "Comment liked",
    });
  } catch (error) {
    console.error("Like comment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to like comment",
    });
  }
});

/**
 * @route   DELETE /api/comments/:commentId/like
 * @desc    Unlike a comment
 * @access  Private
 */
router.delete("/:commentId/like", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { pageId } = req.body;

    const page = await Page.findOne({
      where: { facebookPageId: pageId, userId: req.user.id },
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    await unlikeComment(commentId, page.pageAccessToken);

    res.json({
      success: true,
      message: "Comment unliked",
    });
  } catch (error) {
    console.error("Unlike comment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to unlike comment",
    });
  }
});

/**
 * @route   POST /api/comments/:commentId/hide
 * @desc    Hide a comment
 * @access  Private
 */
router.post("/:commentId/hide", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { pageId } = req.body;

    const page = await Page.findOne({
      where: { facebookPageId: pageId, userId: req.user.id },
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    await hideComment(commentId, page.pageAccessToken);

    res.json({
      success: true,
      message: "Comment hidden",
    });
  } catch (error) {
    console.error("Hide comment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to hide comment",
    });
  }
});

/**
 * @route   POST /api/comments/:commentId/unhide
 * @desc    Unhide a comment
 * @access  Private
 */
router.post("/:commentId/unhide", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { pageId } = req.body;

    const page = await Page.findOne({
      where: { facebookPageId: pageId, userId: req.user.id },
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    await unhideComment(commentId, page.pageAccessToken);

    res.json({
      success: true,
      message: "Comment unhidden",
    });
  } catch (error) {
    console.error("Unhide comment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to unhide comment",
    });
  }
});

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment
 * @access  Private
 */
router.delete("/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { pageId } = req.body;

    const page = await Page.findOne({
      where: { facebookPageId: pageId, userId: req.user.id },
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    await deleteComment(commentId, page.pageAccessToken);

    res.json({
      success: true,
      message: "Comment deleted",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete comment",
    });
  }
});

export default router;

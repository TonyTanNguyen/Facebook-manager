import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Page, User } from "../models/index.js";
import { getUserPages } from "../services/facebook.js";

const router = express.Router();

/**
 * @route   GET /api/pages
 * @desc    Get all pages for the current user (from database)
 * @access  Private
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const pages = await Page.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("Get pages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pages",
    });
  }
});

/**
 * @route   POST /api/pages/sync
 * @desc    Sync pages from Facebook and store in database
 * @access  Private
 */
router.post("/sync", authenticateToken, async (req, res) => {
  try {
    // Fetch pages from Facebook
    const facebookPages = await getUserPages(req.user.accessToken);

    if (!facebookPages || facebookPages.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No pages found on your Facebook account",
      });
    }

    // Sync pages to database
    const syncedPages = [];

    for (const fbPage of facebookPages) {
      const [page, created] = await Page.findOrCreate({
        where: {
          facebookPageId: fbPage.id,
          userId: req.user.id,
        },
        defaults: {
          name: fbPage.name,
          category: fbPage.category,
          picture: fbPage.picture?.data?.url,
          pageAccessToken: fbPage.access_token,
          isSelected: true,
          permissions: [],
          lastSyncedAt: new Date(),
        },
      });

      // Update existing page
      if (!created) {
        await page.update({
          name: fbPage.name,
          category: fbPage.category,
          picture: fbPage.picture?.data?.url,
          pageAccessToken: fbPage.access_token,
          lastSyncedAt: new Date(),
        });
      }

      syncedPages.push(page);
    }

    res.json({
      success: true,
      data: syncedPages,
      message: `Synced ${syncedPages.length} pages from Facebook`,
    });
  } catch (error) {
    console.error("Sync pages error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to sync pages from Facebook",
    });
  }
});

/**
 * @route   GET /api/pages/selected
 * @desc    Get only selected pages
 * @access  Private
 */
router.get("/selected", authenticateToken, async (req, res) => {
  try {
    const pages = await Page.findAll({
      where: {
        userId: req.user.id,
        isSelected: true,
      },
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("Get selected pages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get selected pages",
    });
  }
});

/**
 * @route   PUT /api/pages/:id/select
 * @desc    Toggle page selection
 * @access  Private
 */
router.put("/:id/select", authenticateToken, async (req, res) => {
  try {
    const page = await Page.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    await page.update({
      isSelected: !page.isSelected,
    });

    res.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error("Toggle page selection error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update page selection",
    });
  }
});

/**
 * @route   PUT /api/pages/selection
 * @desc    Bulk update page selections
 * @access  Private
 */
router.put("/selection", authenticateToken, async (req, res) => {
  try {
    const { selectedIds } = req.body;

    if (!Array.isArray(selectedIds)) {
      return res.status(400).json({
        success: false,
        message: "selectedIds must be an array",
      });
    }

    // Deselect all pages first
    await Page.update(
      { isSelected: false },
      { where: { userId: req.user.id } }
    );

    // Select the specified pages
    if (selectedIds.length > 0) {
      await Page.update(
        { isSelected: true },
        {
          where: {
            id: selectedIds,
            userId: req.user.id,
          },
        }
      );
    }

    // Return updated pages
    const pages = await Page.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("Bulk selection error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update page selections",
    });
  }
});

/**
 * @route   POST /api/pages/select-all
 * @desc    Select all pages
 * @access  Private
 */
router.post("/select-all", authenticateToken, async (req, res) => {
  try {
    await Page.update({ isSelected: true }, { where: { userId: req.user.id } });

    const pages = await Page.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("Select all error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to select all pages",
    });
  }
});

/**
 * @route   POST /api/pages/deselect-all
 * @desc    Deselect all pages
 * @access  Private
 */
router.post("/deselect-all", authenticateToken, async (req, res) => {
  try {
    await Page.update(
      { isSelected: false },
      { where: { userId: req.user.id } }
    );

    const pages = await Page.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("Deselect all error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deselect all pages",
    });
  }
});

export default router;

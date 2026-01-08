import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Page, User } from "../models/index.js";
import { getUserPages, getAllBusinessPages } from "../services/facebook.js";

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
 * @desc    Sync pages from Facebook (personal + Business Manager)
 * @access  Private
 */
router.post("/sync", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const isInternalAdmin = req.user.type === "internal";
    const syncedPages = [];
    const existingPageIds = new Set();

    // For internal admin, use System User token from env
    if (isInternalAdmin) {
      const systemToken = process.env.SYSTEM_USER_TOKEN;
      const businessId = process.env.BUSINESS_MANAGER_ID;

      if (!systemToken || !businessId) {
        return res.status(400).json({
          success: false,
          message: "SYSTEM_USER_TOKEN and BUSINESS_MANAGER_ID must be configured in environment variables",
        });
      }

      // Fetch Business Manager pages using System User token
      let bmPages = [];
      try {
        bmPages = await getAllBusinessPages(businessId, systemToken);
        console.log(`Found ${bmPages.length} Business Manager pages`);
      } catch (error) {
        console.error("Error fetching Business Manager pages:", error.message);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch pages: " + error.message,
        });
      }

      // Sync Business Manager pages
      for (const fbPage of bmPages) {
        const [page, created] = await Page.findOrCreate({
          where: {
            facebookPageId: fbPage.id,
            userId: userId,
          },
          defaults: {
            name: fbPage.name,
            category: fbPage.category,
            picture: fbPage.picture?.data?.url,
            pageAccessToken: fbPage.access_token,
            isSelected: true,
            permissions: [],
            source: "business_manager",
            lastSyncedAt: new Date(),
          },
        });

        if (!created) {
          await page.update({
            name: fbPage.name,
            category: fbPage.category,
            picture: fbPage.picture?.data?.url,
            pageAccessToken: fbPage.access_token,
            source: "business_manager",
            lastSyncedAt: new Date(),
          });
        }

        syncedPages.push(page);
      }

      return res.json({
        success: true,
        data: syncedPages,
        message: `Synced ${syncedPages.length} pages from Business Manager`,
      });
    }

    // For Facebook OAuth users (legacy flow)
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 1. Fetch personal pages from Facebook OAuth
    let personalPages = [];
    try {
      personalPages = await getUserPages(user.accessToken);
      console.log(`Found ${personalPages.length} personal pages`);
    } catch (error) {
      console.error("Error fetching personal pages:", error.message);
    }

    // Sync personal pages
    for (const fbPage of personalPages) {
      const [page, created] = await Page.findOrCreate({
        where: {
          facebookPageId: fbPage.id,
          userId: user.id,
        },
        defaults: {
          name: fbPage.name,
          category: fbPage.category,
          picture: fbPage.picture?.data?.url,
          pageAccessToken: fbPage.access_token,
          isSelected: true,
          permissions: [],
          source: "personal",
          lastSyncedAt: new Date(),
        },
      });

      if (!created) {
        await page.update({
          name: fbPage.name,
          category: fbPage.category,
          picture: fbPage.picture?.data?.url,
          pageAccessToken: fbPage.access_token,
          source: "personal",
          lastSyncedAt: new Date(),
        });
      }

      syncedPages.push(page);
      existingPageIds.add(fbPage.id);
    }

    // 2. Fetch Business Manager pages (if connected)
    let bmPages = [];
    if (user.businessManagerToken && user.businessManagerId) {
      try {
        bmPages = await getAllBusinessPages(
          user.businessManagerId,
          user.businessManagerToken
        );
        console.log(`Found ${bmPages.length} Business Manager pages`);
      } catch (error) {
        console.error("Error fetching Business Manager pages:", error.message);
      }

      // Sync Business Manager pages (skip if already synced from personal)
      for (const fbPage of bmPages) {
        // Skip if already synced from personal account
        if (existingPageIds.has(fbPage.id)) {
          console.log(`Skipping duplicate page: ${fbPage.name}`);
          continue;
        }

        const [page, created] = await Page.findOrCreate({
          where: {
            facebookPageId: fbPage.id,
            userId: user.id,
          },
          defaults: {
            name: fbPage.name,
            category: fbPage.category,
            picture: fbPage.picture?.data?.url,
            pageAccessToken: fbPage.access_token,
            isSelected: true,
            permissions: [],
            source: "business_manager",
            lastSyncedAt: new Date(),
          },
        });

        if (!created) {
          await page.update({
            name: fbPage.name,
            category: fbPage.category,
            picture: fbPage.picture?.data?.url,
            pageAccessToken: fbPage.access_token,
            source: "business_manager",
            lastSyncedAt: new Date(),
          });
        }

        syncedPages.push(page);
      }
    }

    const personalCount = personalPages.length;
    const bmCount = bmPages.filter((p) => !existingPageIds.has(p.id)).length;

    res.json({
      success: true,
      data: syncedPages,
      message: `Synced ${syncedPages.length} pages (${personalCount} personal, ${bmCount} from Business Manager)`,
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

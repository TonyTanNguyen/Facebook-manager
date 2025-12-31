import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import User from "../models/User.js";
import {
  validateSystemUserToken,
  getBusinesses,
  getAllBusinessPages,
} from "../services/facebook.js";

const router = express.Router();

/**
 * @route   GET /api/business-manager
 * @desc    Get connected Business Manager info
 * @access  Private
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user.businessManagerId) {
      return res.json({
        success: true,
        data: null,
        message: "No Business Manager connected",
      });
    }

    res.json({
      success: true,
      data: {
        businessId: user.businessManagerId,
        businessName: user.businessManagerName,
        connectedAt: user.businessManagerConnectedAt,
      },
    });
  } catch (error) {
    console.error("Get business manager error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get Business Manager info",
    });
  }
});

/**
 * @route   POST /api/business-manager/connect
 * @desc    Connect a Business Manager using System User token
 * @access  Private
 */
router.post("/connect", authenticateToken, async (req, res) => {
  try {
    const { systemUserToken } = req.body;

    if (!systemUserToken) {
      return res.status(400).json({
        success: false,
        message: "System User token is required",
      });
    }

    // Validate the token
    let tokenInfo;
    try {
      tokenInfo = await validateSystemUserToken(systemUserToken);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid System User token: " + error.message,
      });
    }

    // Get businesses accessible by this token
    let businesses;
    try {
      businesses = await getBusinesses(systemUserToken);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Could not fetch businesses: " + error.message,
      });
    }

    if (!businesses || businesses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No businesses found for this System User token",
      });
    }

    // Use the first business (user has single BM)
    const business = businesses[0];

    // Update user with Business Manager info
    const user = await User.findByPk(req.user.id);
    await user.update({
      businessManagerId: business.id,
      businessManagerName: business.name,
      businessManagerToken: systemUserToken,
      businessManagerConnectedAt: new Date(),
    });

    res.json({
      success: true,
      data: {
        businessId: business.id,
        businessName: business.name,
        connectedAt: user.businessManagerConnectedAt,
      },
      message: `Connected to Business Manager: ${business.name}`,
    });
  } catch (error) {
    console.error("Connect business manager error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to connect Business Manager",
    });
  }
});

/**
 * @route   DELETE /api/business-manager/disconnect
 * @desc    Disconnect Business Manager
 * @access  Private
 */
router.delete("/disconnect", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    await user.update({
      businessManagerId: null,
      businessManagerName: null,
      businessManagerToken: null,
      businessManagerConnectedAt: null,
    });

    res.json({
      success: true,
      message: "Business Manager disconnected",
    });
  } catch (error) {
    console.error("Disconnect business manager error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to disconnect Business Manager",
    });
  }
});

/**
 * @route   POST /api/business-manager/validate
 * @desc    Validate the connected Business Manager token
 * @access  Private
 */
router.post("/validate", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user.businessManagerToken) {
      return res.status(400).json({
        success: false,
        message: "No Business Manager connected",
      });
    }

    try {
      await validateSystemUserToken(user.businessManagerToken);
      res.json({
        success: true,
        data: { valid: true },
        message: "Token is valid",
      });
    } catch (error) {
      res.json({
        success: true,
        data: { valid: false },
        message: "Token is invalid or expired: " + error.message,
      });
    }
  } catch (error) {
    console.error("Validate token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate token",
    });
  }
});

/**
 * @route   GET /api/business-manager/pages
 * @desc    Get pages from connected Business Manager (preview, not synced)
 * @access  Private
 */
router.get("/pages", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user.businessManagerToken || !user.businessManagerId) {
      return res.status(400).json({
        success: false,
        message: "No Business Manager connected",
      });
    }

    const pages = await getAllBusinessPages(
      user.businessManagerId,
      user.businessManagerToken
    );

    res.json({
      success: true,
      data: pages.map((page) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        picture: page.picture?.data?.url,
      })),
      count: pages.length,
    });
  } catch (error) {
    console.error("Get business pages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get Business Manager pages: " + error.message,
    });
  }
});

export default router;

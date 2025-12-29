import express from "express";
import passport from "passport";
import { generateToken, authenticateToken } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// @route   GET /api/auth/facebook
// @desc    Initiate Facebook OAuth flow
// @access  Public
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: [
      "email",
      "pages_show_list",
      "pages_read_engagement",
      "pages_read_user_content",
      "pages_manage_engagement",
      "pages_messaging",
    ],
  })
);

// @route   GET /api/auth/facebook/callback
// @desc    Facebook OAuth callback
// @access  Public
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/login?error=auth_failed`,
    session: false,
  }),
  (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = generateToken(req.user);

      // Update last login
      req.user.update({ lastLoginAt: new Date() });

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/login?error=token_generation_failed`);
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["accessToken", "refreshToken"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        selectedPages: user.selectedPages,
        settings: user.settings,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user information",
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Optionally invalidate tokens or update user status
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    const newToken = generateToken(req.user);

    res.json({
      success: true,
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Token refresh failed",
    });
  }
});

// @route   DELETE /api/auth/account
// @desc    Delete user account and data
// @access  Private
router.delete("/account", authenticateToken, async (req, res) => {
  try {
    await User.destroy({ where: { id: req.user.id } });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
});

// @route   GET /api/auth/status
// @desc    Check authentication status
// @access  Public
router.get("/status", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.json({
        success: true,
        data: {
          isAuthenticated: false,
        },
      });
    }

    // Verify token without throwing
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    res.json({
      success: true,
      data: {
        isAuthenticated: !!user,
        user: user
          ? {
              id: user.id,
              name: user.name,
              profilePicture: user.profilePicture,
            }
          : null,
      },
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        isAuthenticated: false,
      },
    });
  }
});

export default router;

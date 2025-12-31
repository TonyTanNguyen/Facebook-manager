import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import passport from "./config/passport.js";
import { syncDatabase } from "./models/index.js";
import authRoutes from "./routes/auth.js";
import pagesRoutes from "./routes/pages.js";
import commentsRoutes from "./routes/comments.js";
import messagesRoutes from "./routes/messages.js";
import statsRoutes from "./routes/stats.js";
import businessManagerRoutes from "./routes/businessManager.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (required for Passport OAuth flow)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/pages", pagesRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/business-manager", businessManagerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// Start server
const startServer = async () => {
  try {
    // Sync database (use { alter: true } in development for schema updates)
    await syncDatabase({ alter: process.env.NODE_ENV === "development" });

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Facebook Pages Manager API                            ║
║                                                            ║
║   Server running on: http://localhost:${PORT}                ║
║   Environment: ${(process.env.NODE_ENV || "development").padEnd(40)}║
║                                                            ║
║   Endpoints:                                               ║
║   - GET  /api/health              Health check             ║
║   - GET  /api/auth/facebook       Start OAuth flow         ║
║   - GET  /api/auth/facebook/callback  OAuth callback       ║
║   - GET  /api/auth/me             Get current user         ║
║   - GET  /api/auth/status         Check auth status        ║
║   - POST /api/auth/logout         Logout                   ║
║   - POST /api/auth/refresh        Refresh token            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

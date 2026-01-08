import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Facebook OAuth Strategy - only initialize if credentials are provided
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ["id", "displayName", "email", "picture.type(large)"],
        scope: [
          "email",
          "pages_show_list",
          "pages_read_engagement",
          "pages_read_user_content",
          "pages_manage_engagement",
          "pages_messaging",
        ],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          // First, try to find by facebookId
          let user = await User.findOne({ where: { facebookId: profile.id } });

          if (user) {
            // Update existing user's token and info
            user = await user.update({
              accessToken,
              refreshToken: refreshToken || user.refreshToken,
              name: profile.displayName,
              email: email || user.email,
              profilePicture: profile.photos?.[0]?.value || user.profilePicture,
              tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            });
          } else if (email) {
            // Try to find by email (handles app change with different facebookId)
            user = await User.findOne({ where: { email } });

            if (user) {
              // Update existing user with new facebookId and token
              user = await user.update({
                facebookId: profile.id,
                accessToken,
                refreshToken: refreshToken || user.refreshToken,
                name: profile.displayName,
                profilePicture: profile.photos?.[0]?.value || user.profilePicture,
                tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              });
            } else {
              // Create new user
              user = await User.create({
                facebookId: profile.id,
                name: profile.displayName,
                email,
                profilePicture: profile.photos?.[0]?.value,
                accessToken,
                refreshToken,
                tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              });
            }
          } else {
            // No email, create new user without email
            user = await User.create({
              facebookId: profile.id,
              name: profile.displayName,
              profilePicture: profile.photos?.[0]?.value,
              accessToken,
              refreshToken,
              tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            });
          }

          return done(null, user);
        } catch (error) {
          console.error("Facebook OAuth Error:", error);
          return done(error, null);
        }
      }
    )
  );
  console.log("✓ Facebook OAuth strategy initialized");
} else {
  console.log("⚠ Facebook OAuth not configured - skipping strategy initialization");
}

export default passport;

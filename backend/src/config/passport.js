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

// Facebook OAuth Strategy
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
        // Find or create user
        let user = await User.findOne({ where: { facebookId: profile.id } });

        if (user) {
          // Update existing user's token and info
          user = await user.update({
            accessToken,
            refreshToken: refreshToken || user.refreshToken,
            name: profile.displayName,
            email: profile.emails?.[0]?.value || user.email,
            profilePicture: profile.photos?.[0]?.value || user.profilePicture,
            tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          });
        } else {
          // Create new user
          user = await User.create({
            facebookId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
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

export default passport;

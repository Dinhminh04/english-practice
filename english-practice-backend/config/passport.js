const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/userModel");

// Google Strategy
// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google profile received:", profile);

        // Find user by google_id
        let results = await User.findByGoogleId(profile.id);
        
        if (results && results.length > 0) {
          console.log("Existing user found:", results[0]);
          return done(null, results[0]);
        }

        // Find user by email (if they registered previously via email)
        results = await User.findByEmail(profile.emails[0].value);
        if (results && results.length > 0) {
          console.log("User exists with this email, updating google_id:", results[0]);
          await User.updateGoogleId(results[0].id, profile.id);
          // Re-fetch the user to get the updated record
          const updatedUser = await User.findById(results[0].id);
          return done(null, updatedUser[0]);
        }

        // Create new user
        const newUser = {
          google_id: profile.id,
          email: profile.emails[0].value,
          display_name: profile.displayName,
          is_verified: true,
          role: "user",
        };

        console.log("Creating new user with data:", newUser);
        const createResult = await User.createWithProvider(newUser);
        const createdUser = await User.findById(createResult.insertId);

        console.log("New user created successfully:", createdUser[0]);
        done(null, createdUser[0]);
      } catch (error) {
        console.error("Google authentication error:", error);
        done(error, null);
      }
    }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL:
        process.env.FACEBOOK_CALLBACK_URL ||
        "http://localhost:5000/api/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "displayName"],
    },
   async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Facebook profile received:", profile);

        // Find user by facebook_id
        let results = await User.findByFacebookId(profile.id);

        if (results && results.length > 0) {
          console.log("Existing Facebook user found:", results[0]);
          return done(null, results[0]);
        }

        // Find user by email (if they registered previously via email)
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (email) {
            results = await User.findByEmail(email);
            if (results && results.length > 0) {
                console.log("User exists with this email, updating facebook_id:", results[0]);
                // You would need to create a User.updateFacebookId function similar to updateGoogleId
                // await User.updateFacebookId(results[0].id, profile.id);
                // For now, let's just return the user
                return done(null, results[0]);
            }
        }

        // Create new user
        const newUser = {
          facebook_id: profile.id,
          email: email || `${profile.id}@facebook.com`, // Fallback email
          display_name: profile.displayName,
          is_verified: true,
          role: "user",
        };

        console.log("Creating new Facebook user with data:", newUser);
        const createResult = await User.createWithProvider(newUser);
        const createdUser = await User.findById(createResult.insertId);

        console.log("New Facebook user created successfully:", createdUser[0]);
        done(null, createdUser[0]);
      } catch (error) {
        console.error("Facebook authentication error:", error);
        done(error, null);
      }
    }
  )
);
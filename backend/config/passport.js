const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const User = require("../models/User");

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id).then((user) => done(null, user)));

function authCallback(accessToken, refreshToken, profile, done) {
  User.findOne({ providerId: profile.id, provider: profile.provider })
    .then((existingUser) => {
      if (existingUser) return done(null, existingUser);

      const newUser = new User({
        providerId: profile.id,
        provider: profile.provider,
        name: profile.displayName,
        email: profile.emails?.[0]?.value || "",
        avatar: profile.photos?.[0]?.value || "",
      });
      newUser.save().then((user) => done(null, user));
    })
    .catch((err) => done(err, null));
}

// ✅ Google
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: "/auth/google/callback",
}, authCallback));

// ✅ GitHub
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: "/auth/github/callback",
}, authCallback));

// ✅ LinkedIn
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: "/auth/linkedin/callback",
  scope: ["r_emailaddress", "r_liteprofile"],
}, authCallback));

module.exports = passport;

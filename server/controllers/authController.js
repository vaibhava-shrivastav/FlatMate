const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashed, role, authProvider: "local",
    });
    res.status(201).json({ token: signToken(user._id), isNewUser: true });
  } catch (err) {
    res.status(500).json({ message: "Registration failed.", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.authProvider !== "local") {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials." });

    res.status(200).json({ token: signToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential, access_token } = req.body;
    let payload;

    if (credential) {
      // GoogleLogin component sends a JWT ID token — verify it directly
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else if (access_token) {
      // useGoogleLogin sends an OAuth access token — fetch userinfo
      const https = require('https');
      const userinfo = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'www.googleapis.com',
          path: '/oauth2/v3/userinfo',
          method: 'GET',
          headers: { Authorization: `Bearer ${access_token}` }
        };
        const request = https.request(options, (response) => {
          let data = '';
          response.on('data', (chunk) => data += chunk);
          response.on('end', () => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`Google API error: ${response.statusCode}`));
            }
          });
        });
        request.on('error', reject);
        request.end();
      });
      payload = userinfo;
    } else {
      return res.status(400).json({ message: "No credential or access_token provided." });
    }

    console.log("[GoogleAuth] Got user info for:", payload.email);

    let user = await User.findOne({ googleId: payload.sub });
    let isNewUser = false;

    if (!user) {
      // Check if user exists with this email (to link Google account)
      user = await User.findOne({ email: payload.email });
      if (user) {
        // Check for conflicting Google link
        if (user.googleId && user.googleId !== payload.sub) {
          return res.status(409).json({
            message: "This email is already linked to a different Google account.",
          });
        }
        // Link Google account to existing email user
        user.googleId = payload.sub;
        await user.save();
      } else {
        // Create new user with Google account
        user = await User.create({
          name: payload.name,
          email: payload.email,
          googleId: payload.sub,
          authProvider: "google",
        });
        isNewUser = true;
      }
    }

    res.status(200).json({ token: signToken(user._id), isNewUser });
  } catch (err) {
    console.error("[GoogleAuth] Error:", err.message, err.stack);
    res.status(401).json({ message: "Google authentication failed.", error: err.message });
  }
};

// Logout endpoint
exports.logout = async (req, res) => {
  // JWT is stateless — nothing to invalidate server-side.
  // This endpoint exists so the client gets a 200 instead of a 404.
  res.status(200).json({ message: "Logged out successfully." });
};
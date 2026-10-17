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
    const { credential } = req.body;
    const https = require('https');

    // Fetch user info from Google's userinfo endpoint using the access token
    const userinfo = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.googleapis.com',
        path: `/oauth2/v3/userinfo?access_token=${credential}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credential}`
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (parseError) {
              reject(new Error('Failed to parse user info response'));
            }
          } else {
            reject(new Error(`Failed to fetch user info: ${res.statusCode}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });

    const payload = userinfo;
    console.log("[GoogleAuth] Got user info for:", payload.email);

    // Verify the access token was issued for our client
    const tokenInfo = await new Promise((resolve, reject) => {
      const tiOptions = {
        hostname: 'oauth2.googleapis.com',
        path: `/tokeninfo?access_token=${credential}`,
        method: 'GET',
      };
      const tiReq = https.request(tiOptions, (tiRes) => {
        let tiData = '';
        tiRes.on('data', (chunk) => tiData += chunk);
        tiRes.on('end', () => {
          if (tiRes.statusCode >= 200 && tiRes.statusCode < 300) {
            resolve(JSON.parse(tiData));
          } else {
            reject(new Error(`Token info error: ${tiRes.statusCode} ${tiData}`));
          }
        });
      });
      tiReq.on('error', reject);
      tiReq.end();
    });

    if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: "Token audience mismatch." });
    }

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
    res.status(401).json({ message: "Google authentication failed.", error: err.message });
  }
};

// Logout endpoint
exports.logout = async (req, res) => {
  // JWT is stateless — nothing to invalidate server-side.
  // This endpoint exists so the client gets a 200 instead of a 404.
  res.status(200).json({ message: "Logged out successfully." });
};
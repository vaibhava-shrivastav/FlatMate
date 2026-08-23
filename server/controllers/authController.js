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
    const { access_token } = req.body;
    
    if (!access_token) {
      throw new Error("No access_token provided.");
    }

    client.setCredentials({ access_token });
    const response = await client.request({ 
      url: 'https://www.googleapis.com/oauth2/v3/userinfo' 
    });
    
    const payload = response.data;

    let user = await User.findOne({ googleId: payload.sub });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        authProvider: "google",
      });
      isNewUser = true;
    }

    res.status(200).json({ token: signToken(user._id), isNewUser });
  } catch (err) {
    res.status(401).json({ message: "Google authentication failed.", error: err.message });
  }
};
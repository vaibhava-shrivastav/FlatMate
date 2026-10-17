const router = require("express").Router();
const { register, login, googleAuth, logout } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/logout", logout);

module.exports = router;


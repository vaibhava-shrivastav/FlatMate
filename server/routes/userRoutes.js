const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getProfile, updateProfile, submitOnboarding } = require("../controllers/userController");

router.get("/me", auth, getProfile);
router.put("/me", auth, updateProfile);
router.post("/onboarding", auth, submitOnboarding);

module.exports = router;
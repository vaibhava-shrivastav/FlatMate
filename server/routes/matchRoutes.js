const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getMatchesForUser, getMatchDetail } = require("../controllers/matchController");

router.get("/", auth, getMatchesForUser);
router.get("/:id", auth, getMatchDetail);

module.exports = router;
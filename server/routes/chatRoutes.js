const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getChatHistory, getUserChats } = require("../controllers/chatController");

router.get("/", auth, getUserChats);
router.get("/:chatId", auth, getChatHistory);

module.exports = router;
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const c = require("../controllers/listingController");

router.post("/", auth, c.createListing);
router.get("/", auth, c.getListings);
router.get("/:id", auth, c.getListingById);
router.put("/:id", auth, c.updateListing);
router.delete("/:id", auth, c.deleteListing);

module.exports = router;
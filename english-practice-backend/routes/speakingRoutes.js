const express = require("express");
const router = express.Router();
const speakingController = require("../controllers/speakingController");
const auth = require("../middleware/authMiddleware");

router.get("/topic", auth, speakingController.getSpeakingTopic);
router.post("/evaluate", auth, speakingController.evaluateSpeaking);

module.exports = router;

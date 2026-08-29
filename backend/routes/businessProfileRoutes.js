import express from "express";
import {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
} from "../controllers/businessProfileController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getProfiles).post(createProfile);
router.route("/:id").put(updateProfile).delete(deleteProfile);

export default router;

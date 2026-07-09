import { Router } from "express";
import { requireFirebaseAuth } from "../../../middleware/firebase-auth.js";
import { 
  finalizeOnboardingController,
  saveProgressController,
  getProgressController
} from "./onboarding.controller.js";

const router = Router();

// Apply auth middleware to all routes in this file
router.use(requireFirebaseAuth);

router.post("/finalize", finalizeOnboardingController);
router.post("/progress", saveProgressController);
router.get("/progress", getProgressController);

export default router;

import { Router } from "express";
import componentCtrl from "../controllers/componentController";
import { requireAdmin } from "../middleware/admin";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Public list
router.get("/", componentCtrl.getComponents);

// Admin CRUD
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  componentCtrl.createComponent
);
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  componentCtrl.updateComponent
);
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  componentCtrl.deleteComponent
);

// Compatibility validator (used by admin product form)
router.post(
  "/validate",
  authenticateToken,
  requireAdmin,
  componentCtrl.validateCompatibility
);

export default router;

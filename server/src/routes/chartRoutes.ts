import { Router } from "express";
import {
  fetchCharts,
  createNewChart,
  editChart,
  removeChart,
} from "../controllers/chartController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Anyone who is authenticated can GET the list of charts
router.get("/", requireAuth, fetchCharts);

// Only admins can create/edit/delete
router.post("/", requireAuth, createNewChart);
router.put("/:id", requireAuth, editChart);
router.delete("/:id", requireAuth, removeChart);

export default router;

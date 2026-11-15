import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategory,
  getCategoryById,
  updateCategory,
} from "./category.controllers.js";

const router = Router();

router.route("/").post(createCategory).get(getCategory);

router
  .route("/:id")
  .get(getCategoryById)
  .patch(updateCategory)
  .delete(deleteCategory);

export const categoryRoutes = router;

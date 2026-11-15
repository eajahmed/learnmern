
import { asyncHandler } from "../../../utils/asyncHandler.js";

import {
  createCategoryService,
  getCategoriesService,
  getCategoryByIdService,
  updateCategoryService,
  deleteCategoryService,
} from "./category.service.js";

import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.type.js";

// Create Category
export const createCategory = asyncHandler(async (req, res) => {
  const category = await createCategoryService(
    req.body as CreateCategoryInput,
  );

  res.status(201).json({
    success: true,
    data: category,
  });
});

// Get All Categories
export const getCategory = asyncHandler(async (req, res) => {
  const categories = await getCategoriesService();

  if (categories.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No Category Found",
    });
  }

  res.status(200).json({
    success: true,
    data: categories,
  });
});

// Get Category By ID
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await getCategoryByIdService(req.params.id as string);

  res.status(200).json({
    success: true,
    data: category,
  });
});

// Update Category
export const updateCategory = asyncHandler(async (req, res) => {
  const updatedCategory = await updateCategoryService(
    req.params.id as string,
    req.body as UpdateCategoryInput,
  );

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: updatedCategory,
  });
});

// Delete Category
export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await deleteCategoryService(req.params.id as string);

  if (!result.deleted) {
    return res.status(400).json({
      success: false,
      message:
        "Cannot delete category. Products are already assigned to this category.",
      productCount: result.productCount,
    });
  }

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});

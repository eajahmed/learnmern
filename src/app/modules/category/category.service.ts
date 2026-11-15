
import { ObjectId } from "mongodb";

import { getDB } from "../../../config/db.js";
import { ApiError } from "../../../utils/apiError.js";

import type {
  CategoryDocument,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryWithCount,
} from "./category.type.js";

// Get Category Collection
const getCollection = () =>
  getDB().collection<CategoryDocument>("category");

// Create Category
export const createCategoryService = async (
  data: CreateCategoryInput,
) => {
  // Allow only the "name" field
  const allowedFields = ["name"];

  const unexpectedFields = Object.keys(data).filter(
    (key) => !allowedFields.includes(key),
  );

  if (unexpectedFields.length > 0) {
    throw new ApiError(400, "Unexpected fields are not allowed");
  }

  // Validate Category Name
  const { name } = data;

  if (typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Please provide a valid Category Name");
  }

  // Create Category
  const newCategory: CategoryDocument = {
    name: name.trim(),
    createdAt: new Date(),
  };

  // Save to MongoDB
  const result = await getCollection().insertOne(newCategory);

  return {
    _id: result.insertedId,
    ...newCategory,
  };
};

// Get All Categories
export const getCategoriesService = async (): Promise<
  CategoryWithCount[]
> => {
  const categoryData = await getCollection().find().toArray();

  const categoriesWithCount = await Promise.all(
    categoryData.map(async (category) => {
      const productCount = await getDB()
        .collection("product")
        .countDocuments({
          categoryId: category._id,
        });

      return {
        _id: category._id,
        name: category.name,
        productCount,
      };
    }),
  );

  return categoriesWithCount;
};

// Get Category By ID
export const getCategoryByIdService = async (id: string) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid MongoDB ObjectId format");
  }

  const category = await getCollection().findOne({
    _id: new ObjectId(id),
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

// Update Category
export const updateCategoryService = async (
  id: string,
  data: UpdateCategoryInput,
) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid MongoDB ObjectId format");
  }

  const { name } = data;

  if (typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Please provide a valid Category Name");
  }

  const updateFields = {
    name: name.trim(),
    updatedAt: new Date(),
  };

  const categoryObjectId = new ObjectId(id);

  const result = await getCollection().updateOne(
    { _id: categoryObjectId },
    { $set: updateFields },
  );

  if (result.matchedCount === 0) {
    throw new ApiError(404, "Category not found");
  }

  const updatedCategory = await getCollection().findOne({
    _id: categoryObjectId,
  });

  return updatedCategory;
};

// Delete Category
export const deleteCategoryService = async (id: string) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid MongoDB ObjectId format");
  }

  const categoryObjectId = new ObjectId(id);

  // Check whether products use this category
  const productCount = await getDB()
    .collection("product")
    .countDocuments({
      categoryId: categoryObjectId,
    });

  // Stop deletion if products exist
  if (productCount > 0) {
    return {
      deleted: false as const,
      productCount,
    };
  }

  // Delete Category
  const result = await getCollection().deleteOne({
    _id: categoryObjectId,
  });

  if (result.deletedCount === 0) {
    throw new ApiError(404, "Category not found");
  }

  return {
    deleted: true as const,
  };
};

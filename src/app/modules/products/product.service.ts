
import { ObjectId, type Filter } from "mongodb";

import { getDB } from "../../../config/db.js";
import { ApiError } from "../../../utils/apiError.js";

import type {
  ProductDocument,
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
} from "./product.type.js";

// Get Product Collection
const getCollection = () =>
  getDB().collection<ProductDocument>("product");

// Create Product
export const createProductService = async (data: CreateProductInput) => {
  // Allow only these fields
  const allowedFields = [
    "name",
    "categoryId",
    "brand",
    "ram",
    "ssd",
    "price",
    "inStock",
  ];

  const unexpectedFields = Object.keys(data).filter(
    (key) => !allowedFields.includes(key),
  );

  if (unexpectedFields.length > 0) {
    throw new ApiError(400, "Unexpected fields are not allowed");
  }

  const { name, categoryId, brand, ram, ssd, price, inStock } = data;

  // Required field validation
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof categoryId !== "string" ||
    !categoryId.trim() ||
    typeof ram !== "string" ||
    !ram.trim() ||
    typeof ssd !== "string" ||
    !ssd.trim()
  ) {
    throw new ApiError(
      400,
      "Please provide valid name, category, ram, and ssd",
    );
  }

  // Category ID validation
  if (!ObjectId.isValid(categoryId)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const categoryObjectId = new ObjectId(categoryId);

  // Check category existence
  const categoryExists = await getDB()
    .collection("category")
    .findOne({ _id: categoryObjectId });

  if (!categoryExists) {
    throw new ApiError(
      404,
      "Category not found. Please provide an existing category ID",
    );
  }

  // Price validation
  if (
    price === undefined ||
    price === null ||
    (typeof price === "string" && !price.trim())
  ) {
    throw new ApiError(400, "Price is required");
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    throw new ApiError(
      400,
      "Price must be a valid number greater than zero",
    );
  }

  // Optional field validation
  if (brand !== undefined && typeof brand !== "string") {
    throw new ApiError(400, "Brand must be a string");
  }

  if (inStock !== undefined && typeof inStock !== "boolean") {
    throw new ApiError(400, "inStock must be true or false");
  }

  // Prepare Product Data
  const newProduct: ProductDocument = {
    name: name.trim(),
    categoryId: categoryObjectId,
    brand: brand?.trim() ?? "",
    ram: ram.trim(),
    ssd: ssd.trim(),
    price: numericPrice,
    inStock: inStock ?? true,
    createdAt: new Date(),
  };

  const result = await getCollection().insertOne(newProduct);

  return {
    _id: result.insertedId,
    ...newProduct,
  };
};

// Get All Products
export const getProductsService = async (query: ProductQuery) => {
  const {
    name,
    categoryId,
    brand,
    ram,
    ssd,
    inStock,
    minPrice,
    maxPrice,
  } = query;

  const filters: Filter<ProductDocument> = {};

  // Name Filter
  if (name) {
    filters.name = {
      $regex: name,
      $options: "i",
    };
  }

  // Category Filter
  if (categoryId) {
    if (!ObjectId.isValid(categoryId)) {
      throw new ApiError(400, "Invalid Category ID");
    }

    filters.categoryId = new ObjectId(categoryId);
  }

  // Brand Filter
  if (brand) {
    filters.brand = {
      $in: brand.split(",").map((item) => item.trim()),
    };
  }

  // RAM Filter
  if (ram) {
    filters.ram = {
      $in: ram.split(",").map((item) => item.trim()),
    };
  }

  // SSD Filter
  if (ssd) {
    filters.ssd = {
      $in: ssd.split(",").map((item) => item.trim()),
    };
  }

  // In Stock Filter
  if (inStock === "true") {
    filters.inStock = true;
  }

  // Price Validation
  const hasMinPrice = minPrice !== undefined && minPrice !== "";
  const hasMaxPrice = maxPrice !== undefined && maxPrice !== "";

  const min = hasMinPrice ? Number(minPrice) : undefined;
  const max = hasMaxPrice ? Number(maxPrice) : undefined;

  if (hasMinPrice && (!Number.isFinite(min) || min === undefined)) {
    throw new ApiError(400, "Invalid minimum price");
  }

  if (hasMaxPrice && (!Number.isFinite(max) || max === undefined)) {
    throw new ApiError(400, "Invalid maximum price");
  }

  if ((min !== undefined && min < 0) || (max !== undefined && max < 0)) {
    throw new ApiError(400, "Price cannot be negative");
  }

  if (min !== undefined && max !== undefined && min > max) {
    throw new ApiError(
      400,
      "Minimum price cannot exceed maximum price",
    );
  }

  // Price Filter
  if (hasMinPrice || hasMaxPrice) {
    const priceFilter: {
      $gte?: number;
      $lte?: number;
    } = {};

    if (min !== undefined) {
      priceFilter.$gte = min;
    }

    if (max !== undefined) {
      priceFilter.$lte = max;
    }

    filters.price = priceFilter;
  }

  // Get Products
  const productData = await getCollection()
    .find(filters)
    .toArray();

  if (productData.length === 0) {
    throw new ApiError(404, "No Product Found");
  }

  return productData;
};

// Get Product By ID
export const getProductByIdService = async (id: string) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid MongoDB ObjectId format");
  }

  const product = await getCollection().findOne({
    _id: new ObjectId(id),
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

// Update Product By ID
export const updateProductService = async (
  id: string,
  data: UpdateProductInput,
) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid MongoDB ObjectId format");
  }

  const allowedFields = [
    "name",
    "categoryId",
    "brand",
    "ram",
    "ssd",
    "price",
    "inStock",
  ];

  const unexpectedFields = Object.keys(data).filter(
    (key) => !allowedFields.includes(key),
  );

  if (unexpectedFields.length > 0) {
    throw new ApiError(400, "Unexpected fields are not allowed");
  }

  const updateFields: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };

  // Category ID validation
  if (data.categoryId !== undefined) {
    if (!ObjectId.isValid(data.categoryId)) {
      throw new ApiError(400, "Invalid category ID");
    }

    const categoryObjectId = new ObjectId(data.categoryId);

    const categoryExists = await getDB()
      .collection("category")
      .findOne({ _id: categoryObjectId });

    if (!categoryExists) {
      throw new ApiError(404, "Category not found");
    }

    updateFields.categoryId = categoryObjectId;
  }

  // Price validation
  if (
    updateFields.price === "" ||
    updateFields.price === null
  ) {
    throw new ApiError(400, "Price cannot be empty");
  }

  if (updateFields.price !== undefined) {
    const numericPrice = Number(updateFields.price);

    if (!Number.isFinite(numericPrice)) {
      throw new ApiError(400, "Price must be a valid number");
    }

    if (numericPrice <= 0) {
      throw new ApiError(400, "Price must be greater than zero");
    }

    updateFields.price = numericPrice;
  }

  const result = await getCollection().updateOne(
    { _id: new ObjectId(id) },
    { $set: updateFields },
  );

  if (result.matchedCount === 0) {
    throw new ApiError(404, "Product not found");
  }

  const updatedProduct = await getCollection().findOne({
    _id: new ObjectId(id),
  });

  return updatedProduct;
};

// Delete Product
export const deleteProductService = async (id: string) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid MongoDB ObjectId format");
  }

  const result = await getCollection().deleteOne({
    _id: new ObjectId(id),
  });

  if (result.deletedCount === 0) {
    throw new ApiError(404, "Product not found");
  }

  return {
    message: "Product deleted successfully",
  };
};

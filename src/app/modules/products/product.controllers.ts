import { asyncHandler } from "../../../utils/asyncHandler.js";

import {
  createProductService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
} from "./product.service.js";

import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
} from "./product.type.js";

// Create Product
export const createProduct = asyncHandler(async (req, res) => {
  const product = await createProductService(
    req.body as CreateProductInput,
  );

  res.status(201).json({
    success: true,
    data: product,
  });
});

// Get All Products
export const getProduct = asyncHandler(async (req, res) => {
  const products = await getProductsService(
    req.query as ProductQuery,
  );

  res.status(200).json({
    success: true,
    data: products,
  });
});

// Get Product By ID
export const getProductById = asyncHandler(async (req, res) => {
  const product = await getProductByIdService(req.params.id as string);

  res.status(200).json({
    success: true,
    data: product,
  });
});

// Update Product
export const updateProduct = asyncHandler(async (req, res) => {
  const updatedProduct = await updateProductService(
    req.params.id as string,
    req.body as UpdateProductInput,
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: updatedProduct,
  });
});

// Delete Product
export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await deleteProductService(req.params.id as string);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

import type { ObjectId } from "mongodb";

export interface ProductDocument {
  _id?: ObjectId;
  name: string;
  categoryId: ObjectId;
  brand: string;
  ram: string;
  ssd: string;
  price: number;
  inStock: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateProductInput {
  name: string;
  categoryId: string;
  brand?: string;
  ram: string;
  ssd: string;
  price: number | string;
  inStock?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  brand?: string;
  ram?: string;
  ssd?: string;
  price?: number | string;
  inStock?: boolean;
}

export interface ProductQuery {
  name?: string;
  categoryId?: string;
  brand?: string;
  ram?: string;
  ssd?: string;
  inStock?: string;
  minPrice?: string;
  maxPrice?: string;
}
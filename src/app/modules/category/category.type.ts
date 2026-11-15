
import type { ObjectId } from "mongodb";

export interface CategoryDocument {
  _id?: ObjectId;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  name: string;
}

export interface CategoryWithCount {
  _id: ObjectId;
  name: string;
  productCount: number;
}

import express, { type Express, type Request, type Response } from 'express';
import { errorHandler } from "./app/middleware/errorHandler.js";
import { productRoutes } from './app/modules/products/product.routes.js';
import { categoryRoutes } from './app/modules/category/category.route.js';
import { authRoutes } from './app/modules/auth/user.routes.js';

const app: Express = express();

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "server Runing",
  });
});

//Middleware
app.use(express.json());
app.use(errorHandler);

//Routes
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/auth", authRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: "Page Not Found",
  });
});

export default app;
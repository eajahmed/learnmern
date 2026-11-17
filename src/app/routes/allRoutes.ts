import { Router } from 'express';
import app from '../../app.js';
import { authRoutes } from '../modules/auth/user.routes.js';
import { categoryRoutes } from '../modules/category/category.route.js';
import { productRoutes } from '../modules/products/product.routes.js';

const routes = [
 {   path: "/product",
     route: productRoutes
 },
 {   path: "/category",
     route: categoryRoutes
 },
 {   path: "/auth",
     route: authRoutes
 }
]

const router = Router();

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export const allRoutes = router;
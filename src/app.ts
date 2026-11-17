import express, { type Express, type Request, type Response } from 'express';
import { errorHandler } from "./app/middleware/errorHandler.js";
import { allRoutes } from './app/routes/allRoutes.js';

const app: Express = express();

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "server Runing",
  });
});

//Routes
app.use("/api/v1", allRoutes);

//Middleware
app.use(express.json());
app.use(errorHandler);


app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: "Page Not Found",
  });
});

export default app;
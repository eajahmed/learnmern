import app from "./app.js";
import config from "./config/config.js";
import { connectDB } from "./config/db.js";

const port = config.port;

try {
  await connectDB();
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
} catch (error: unknown) {
  console.error("Startup failed:", (error as Error).message);
  process.exit(1);
}

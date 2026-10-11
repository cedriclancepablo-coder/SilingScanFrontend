import "dotenv/config";
import { createApp } from "./app.js";
import { initializeDatabase } from "./store.js";

const start = async (): Promise<void> => {
  await initializeDatabase();
  const app = createApp();
  const port = Number(process.env.PORT) || 8000;

  app.listen(port, () => {
    console.log(`SilingScan API is running at http://localhost:${port}`);
  });
};

void start().catch((error: unknown) => {
  console.error("Unable to start the SilingScan API:", error);
  process.exitCode = 1;
});

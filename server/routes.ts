import { Express } from "express";

export async function registerRoutes(app: Express) {
  // Register API routes here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Add more routes as needed

  return app;
}
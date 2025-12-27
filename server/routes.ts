/// <reference path="./types.d.ts" />
import { Express } from "express";
import multer from "multer";
import * as aiController from "./controllers/aiController";

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express) {
  // Register API routes here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Sync current user to database (called by frontend after login)
  app.post("/api/auth/sync-user", async (req, res) => {
    try {
      const { UserService } = await import("./services/userService");

      // Get user data from request body (sent by frontend)
      const clerkUser = req.body.user;

      if (!clerkUser || !clerkUser.id) {
        return res.status(400).json({ error: "No user data provided" });
      }

      // Check if user already exists
      const existingUser = await UserService.getUserByClerkId(clerkUser.id);
      if (existingUser) {
        return res.json({ message: "User already synced", user: existingUser });
      }

      // Create new user in database
      const newUser = await UserService.createUser({
        id: clerkUser.id,
        clerkId: clerkUser.id,
        email: clerkUser.email_addresses?.[0]?.email_address || '',
        firstName: clerkUser.first_name || null,
        lastName: clerkUser.last_name || null,
        imageUrl: clerkUser.image_url || null,
      });

      console.log(`🎉 User ${clerkUser.id} synced to database:`, newUser);
      res.json({ message: "User synced successfully", user: newUser });
    } catch (error) {
      console.error("User sync error:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Get current user data from database
  app.post("/api/auth/me", async (req, res) => {
    try {
      const { UserService } = await import("./services/userService");

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "No user ID provided" });
      }

      const user = await UserService.getUserByClerkId(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found in database" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });


  // AI Call Assistant Routes
  
  // Speech-to-text endpoint
  app.post("/api/call/speech-to-text", upload.single('audio'), aiController.speechToText);

  // Intent detection and reply generation (validate conversation context first)
  const { validateCallContextMiddleware } = await import('./middleware/contextValidator');
  app.post("/api/call/process-intent", validateCallContextMiddleware(false), aiController.processIntent);

  // Text-to-speech endpoint
  app.post("/api/call/text-to-speech", aiController.textToSpeech);

  // Add more routes as needed

  return app;
}
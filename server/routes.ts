/// <reference path="./types.d.ts" />
import { Express } from "express";

export async function registerRoutes(app: Express) {
  // Register API routes here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Sync current user to database (called by frontend after login)
  app.post("/api/auth/sync-user", async (req, res) => {
    try {
      const { UserService } = await import("./services/userService");

      // Get user data from Clerk JWT token
      const clerkUser = req.user; // This will be set by Clerk middleware

      if (!clerkUser || !clerkUser.id) {
        return res.status(401).json({ error: "No authenticated user" });
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
  app.get("/api/auth/me", async (req, res) => {
    try {
      const { UserService } = await import("./services/userService");

      const clerkUser = req.user;
      if (!clerkUser || !clerkUser.id) {
        return res.status(401).json({ error: "No authenticated user" });
      }

      const user = await UserService.getUserByClerkId(clerkUser.id);
      if (!user) {
        return res.status(404).json({ error: "User not found in database" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Test endpoint to manually trigger user sync (for development)
  app.post("/api/test/sync-user", async (req, res) => {
    try {
      const { clerkId, email, firstName, lastName, imageUrl } = req.body;

      // This simulates what the webhook does
      const { UserService } = await import("./services/userService");

      const existingUser = await UserService.getUserByClerkId(clerkId);
      if (existingUser) {
        return res.json({ message: "User already exists", user: existingUser });
      }

      const newUser = await UserService.createUser({
        id: clerkId,
        clerkId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        imageUrl: imageUrl || null,
      });

      res.json({ message: "User synced successfully", user: newUser });
    } catch (error) {
      console.error("Test sync error:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Add more routes as needed

  return app;
}
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type User, type NewUser } from '../schema';

export class UserService {
  static async createUser(userData: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  static async getUserByClerkId(clerkId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
    return user || null;
  }

  static async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  static async updateUser(id: string, updates: Partial<NewUser>): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  }

  static async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }
}
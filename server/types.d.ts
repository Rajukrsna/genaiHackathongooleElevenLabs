import { Request } from 'express';

// Extend Express Request to include Clerk user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email_addresses?: Array<{
          email_address: string;
        }>;
        first_name?: string;
        last_name?: string;
        image_url?: string;
      };
    }
  }
}
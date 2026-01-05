// src/types/express.d.ts
import { User } from "../models/User"; // Adjust the import path as needed

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        isAdmin: boolean;
      };
    }
  }
}

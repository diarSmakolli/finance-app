import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: any; // Replace 'any' with the actual user type if needed
}
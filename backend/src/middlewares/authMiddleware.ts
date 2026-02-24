import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// We are extending the Express Request type to include our user object
export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  // 1. Check if the token exists in the headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // Get just the token part
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token provided' });
    return;
  }

  try {
    // 2. Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: 'Not authorized, token failed' });
      return;
    }

    // 3. Attach the user to the request so the next function can use it
    req.user = data.user;
    next(); // Move on to the actual upload route!
    
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};
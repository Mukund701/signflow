import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { createClient } from '@supabase/supabase-js';

// @route   POST /api/auth/register
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body;

  try {
    // 1. Sign up the user using Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name } // Storing the user's name in Supabase metadata
      }
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'User registered successfully!', user: data.user });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// @route   POST /api/auth/login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // 1. Log in the user using Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // 2. Send back the session (which contains the JWT access token!)
    res.status(200).json({ 
      message: 'Login successful!', 
      session: data.session 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
};

// @route   POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    // Tell Supabase to send the email, and route them back to our frontend recovery page
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/update-password', 
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error requesting password reset' });
  }
};

// @route   POST /api/auth/update-password
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid token. Please use the link sent to your email.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Backend environment variables (SUPABASE_URL or SUPABASE_SERVICE_KEY) are missing.");
    }

    // 1. Create an Admin client using your Service Key (Master Key)
    const adminClient = createClient(supabaseUrl, serviceKey);

    // 2. Securely verify the token from the email and get the User's ID
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);

    if (userError || !user) {
      console.error("Token Verification Error:", userError?.message);
      res.status(401).json({ error: 'Recovery link is invalid or has expired.' });
      return;
    }

    // 3. Use the Admin API to force the password update for this specific user
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, { 
      password: password 
    });

    if (updateError) {
      console.error("Supabase Admin API Error:", updateError.message);
      res.status(400).json({ error: updateError.message });
      return;
    }

    res.status(200).json({ message: 'Password updated successfully!' });
  } catch (err: any) {
    console.error("Detailed Server Error:", err);
    res.status(500).json({ error: err.message || 'Server error updating password' });
  }
};
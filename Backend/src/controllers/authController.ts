import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const result = await AuthService.login(username, password, ip);
      res.json({
        success: true,
        message: 'Login successful',
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Login failed. Please verify your credentials.',
      });
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      user: req.user,
    });
  }

  static async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await AuthService.getAllUsers();
      res.json({ success: true, users });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, password, fullName, role } = req.body;
      const user = await AuthService.createUser({ username, password, fullName, role }, req.user);
      res.status(201).json({ success: true, message: 'User created successfully', user });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await AuthService.updateUser(id, req.body, req.user);
      res.json({ success: true, message: 'User updated successfully', user });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

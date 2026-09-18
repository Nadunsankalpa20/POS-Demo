import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';
import { AuditService } from './AuditService';

const JWT_SECRET = process.env.JWT_SECRET || 'supermarket_pos_jwt_secret_key_2026_super_secure!';

export class AuthService {
  static async login(username: string, password: string, ipAddress: string = '127.0.0.1') {
    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      throw new Error('Invalid username or password.');
    }

    if (!user.active) {
      throw new Error('This user account has been deactivated. Please contact an administrator.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid username or password.');
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await AuditService.log({
      userId: user._id,
      userName: user.fullName,
      userRole: user.role,
      action: 'LOGIN',
      module: 'AUTH',
      description: `User ${user.username} logged in with role ${user.role}`,
      ipAddress,
    });

    return {
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  static async createUser(data: {
    username: string;
    password: string;
    fullName: string;
    role: UserRole;
  }, creator: any) {
    const existing = await User.findOne({ username: data.username.toLowerCase().trim() });
    if (existing) {
      throw new Error(`User with username '${data.username}' already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      username: data.username.toLowerCase().trim(),
      passwordHash,
      fullName: data.fullName.trim(),
      role: data.role,
      active: true,
    });

    await AuditService.log({
      userId: creator?.id,
      userName: creator?.fullName || 'Admin',
      userRole: creator?.role,
      action: 'CREATE_USER',
      module: 'USERS',
      description: `Created user ${user.username} (${user.role})`,
    });

    return {
      id: user._id.toString(),
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      active: user.active,
    };
  }

  static async getAllUsers() {
    return User.find().select('-passwordHash').sort({ createdAt: -1 });
  }

  static async updateUser(id: string, data: { fullName?: string; role?: UserRole; active?: boolean; password?: string }, modifier: any) {
    const user = await User.findById(id);
    if (!user) throw new Error('User not found');

    if (data.fullName) user.fullName = data.fullName.trim();
    if (data.role) user.role = data.role;
    if (data.active !== undefined) user.active = data.active;
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(data.password, salt);
    }

    await user.save();

    await AuditService.log({
      userId: modifier?.id,
      userName: modifier?.fullName || 'Admin',
      userRole: modifier?.role,
      action: 'UPDATE_USER',
      module: 'USERS',
      description: `Updated user profile for ${user.username}`,
    });

    return {
      id: user._id.toString(),
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      active: user.active,
    };
  }
}

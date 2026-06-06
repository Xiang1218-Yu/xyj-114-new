import bcrypt from 'bcryptjs';
import type { ApiResponse, AuthResponse, User } from '../../shared/types';
import { userRepository } from '../repositories/userRepository';
import { generateToken } from '../middleware/auth';

export const authService = {
  async register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<ApiResponse<AuthResponse>> {
    if (password !== confirmPassword) {
      return { success: false, message: '两次输入的密码不一致' };
    }

    if (password.length < 6) {
      return { success: false, message: '密码长度至少为6位' };
    }

    const existingUsername = userRepository.findByUsername(username);
    if (existingUsername) {
      return { success: false, message: '用户名已存在' };
    }

    const existingEmail = userRepository.findByEmail(email);
    if (existingEmail) {
      return { success: false, message: '邮箱已被注册' };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userId = userRepository.createUser(username, email, passwordHash);
    const user = userRepository.findById(userId);

    if (!user) {
      return { success: false, message: '注册失败，请重试' };
    }

    const token = generateToken(userId);

    return {
      success: true,
      data: { token, user },
      message: '注册成功',
    };
  },

  async login(username: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const user = userRepository.findByUsername(username);
    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }

    const passwordHash = userRepository.getPasswordHashById(user.id);
    if (!passwordHash) {
      return { success: false, message: '用户名或密码错误' };
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: '用户名或密码错误' };
    }

    const token = generateToken(user.id);

    return {
      success: true,
      data: { token, user },
      message: '登录成功',
    };
  },

  getCurrentUser(userId: number): ApiResponse<User> {
    const user = userRepository.findById(userId);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    return {
      success: true,
      data: user,
    };
  },
};

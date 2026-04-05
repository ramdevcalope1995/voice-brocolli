import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AuthResponse, AuthUser } from './auth.types';
import { User, UserDocument } from './schemas/user.schema';
import { AuthSession, AuthSessionDocument } from './schemas/session.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AuthSession.name)
    private readonly sessionModel: Model<AuthSessionDocument>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const password = this.normalizePassword(dto.password);
    const displayName = this.normalizeDisplayName(dto.displayName, email);

    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException('An account with that email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.userModel.create({
      email,
      passwordHash,
      displayName,
    });

    return this.issueSession(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const password = this.normalizePassword(dto.password);

    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueSession(user);
  }

  async logout(token: string): Promise<void> {
    await this.sessionModel.deleteOne({ token }).exec();
  }

  async me(userId: string): Promise<AuthUser | null> {
    const user = await this.userModel.findById(userId).exec();
    return user ? this.toPublicUser(user) : null;
  }

  async resolveSession(token: string): Promise<AuthUser | null> {
    const session = await this.sessionModel
      .findOne({ token, expiresAt: { $gt: new Date() } })
      .exec();
    if (!session) {
      return null;
    }

    const user = await this.userModel.findById(session.userId).exec();
    if (!user) {
      await session.deleteOne();
      return null;
    }

    return this.toPublicUser(user);
  }

  async createSessionForUser(user: UserDocument): Promise<AuthResponse> {
    return this.issueSession(user);
  }

  private async issueSession(user: UserDocument): Promise<AuthResponse> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await this.sessionModel.create({
      token,
      userId: user._id,
      expiresAt,
    });

    return {
      token,
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: UserDocument): AuthUser {
    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
    };
  }

  private normalizeEmail(value?: string): string {
    const email = value?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Email is required');
    }
    return email;
  }

  private normalizePassword(value?: string): string {
    const password = value?.trim();
    if (!password || password.length < 8) {
      throw new UnauthorizedException('Password must be at least 8 characters long');
    }
    return password;
  }

  private normalizeDisplayName(value: string | undefined, email: string): string {
    const displayName = value?.trim();
    if (displayName) {
      return displayName;
    }
    return email.split('@')[0] || 'Guest';
  }
}

import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  private publicUser(user: User) {
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  }

  private session(user: User) {
    return {
      accessToken: this.jwt.sign({ sub: user.id, email: user.email }),
      user: this.publicUser(user),
    };
  }

  async register(name: string, email: string, password: string) {
    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedName || normalizedName.length < 2 || normalizedName.length > 80) {
      throw new BadRequestException('Display name must be between 2 and 80 characters.');
    }

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new BadRequestException('A valid email address is required.');
    }

    if (!password || password.length < 8 || password.length > 128) {
      throw new BadRequestException('Password must be between 8 and 128 characters.');
    }

    if (await this.users.findOne({ where: { email: normalizedEmail } })) {
      throw new ConflictException('Unable to create an account with those details.');
    }

    const user = this.users.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
    });

    return this.session(await this.users.save(user));
  }

  async login(email: string, password: string) {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const user = await this.users.findOne({ where: { email: normalizedEmail } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.session(user);
  }

  async findPublicUser(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }

  async updateProfile(id: string, name: string) {
    const trimmedName = name?.trim();

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 80) {
      throw new BadRequestException('Display name must be between 2 and 80 characters.');
    }

    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException();

    user.name = trimmedName;
    return this.publicUser(await this.users.save(user));
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword?: string,
  ) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException();

    if (!currentPassword || currentPassword.trim().length < 1) {
      throw new BadRequestException('Current password is required.');
    }

    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    if (!newPassword || newPassword.length < 8 || newPassword.length > 128) {
      throw new BadRequestException('New password must be between 8 and 128 characters.');
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match.');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.users.save(user);
    return { success: true };
  }
}

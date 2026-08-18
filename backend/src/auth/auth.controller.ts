import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

class ProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;
}

class PasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  confirmPassword?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register(body.name, body.email, body.password);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  @Post('logout')
  logout() {
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: { user: { id: string } }) {
    return this.auth.findPublicUser(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  profile(@Body() body: ProfileDto, @Req() request: { user: { id: string } }) {
    return this.auth.updateProfile(request.user.id, body.name);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  password(@Body() body: PasswordDto, @Req() request: { user: { id: string } }) {
    return this.auth.changePassword(request.user.id, body.currentPassword, body.newPassword, body.confirmPassword);
  }
}

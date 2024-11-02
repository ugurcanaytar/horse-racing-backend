import {
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.authService.validateUser(
      registerDto.username,
      registerDto.password,
    );
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    await this.authService.register(registerDto);
    const loginDto: LoginDto = {
      username: registerDto.username,
      password: registerDto.password,
    };
    const token = await this.authService.login(loginDto);
    return token;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    console.log('Login request received:', loginDto);
    const userData = await this.authService.login(loginDto);
    if (userData) {
      return userData;
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Get('validate-token')
  async validateToken(@Headers('authorization') token: string) {
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }
    try {
      // Strip "Bearer " from the token before using it
      const jwt = token.replace('Bearer ', '');

      // Decode the token to get the userId
      const decoded = this.jwtService.verify(jwt);
      const userId = decoded.sub;

      // Pass the stripped token to the auth service
      const isValid = await this.authService.validateToken(userId, jwt);
      if (isValid) {
        return { valid: true };
      } else {
        throw new UnauthorizedException('Invalid token');
      }
    } catch (e) {
      throw new UnauthorizedException(e);
    }
  }
}

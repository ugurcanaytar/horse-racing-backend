import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  private redisClient: Redis | null;
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {
    this.redisClient = this.redisService.getOrThrow();
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.validateUser(username, password);
    if (user) {
      return user;
    }
    return null;
  }

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });
    return { message: 'User registered successfully' };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ role: string; access_token: string }> {
    // Retrieve the user from the database
    const user = await this.usersService.findByUsername(loginDto.username);

    if (!loginDto.password) {
      throw new UnauthorizedException('Password is required');
    }

    if (user && user.password) {
      // Compare the provided password with the hashed password in the database
      const isPasswordMatch = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (isPasswordMatch) {
        // Construct the JWT payload
        const payload = {
          username: user.username,
          sub: user.id,
          role: user.role,
        };
        const accessToken = this.jwtService.sign(payload);

        // Store the token in Redis with an expiration of 1 hour (3600 seconds)
        if (this.redisClient) {
          console.log(`Redis work ongoing for ${accessToken}`);
          await this.redisClient.set(
            `user-token-${user.id}`,
            accessToken,
            'EX',
            3600,
          );
        }

        return {
          role: user.role,
          access_token: accessToken,
        };
      } else {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else {
      // If user or password is missing, throw an error
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async validateToken(userId: number, token: string): Promise<boolean> {
    if (this.redisClient) {
      // Retrieve the token from Redis
      const storedToken = await this.redisClient.get(`user-token-${userId}`);

      // Debugging output
      console.log(`Stored: ${storedToken}`);
      console.log(`Token to validate: ${token}`);

      // Check if the stored token matches the provided token
      if (storedToken === token) {
        console.log(`Is token valid? ${storedToken === token}`);
        return true;
      } else {
        console.log(`Token mismatch for user ${userId}`);
        return false;
      }
    }
    return false;
  }

  async logout(userId: number): Promise<{ message: string }> {
    if (this.redisClient) {
      await this.redisClient.del(`user-token-${userId}`);
    }
    return { message: 'User logged out successfully' };
  }
}

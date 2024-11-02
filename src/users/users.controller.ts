import { Controller, Get, Param, Request } from '@nestjs/common';
// import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
// import { JwtAuthGuard } from '../auth/jwt_auth.guard';

// @UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req): Promise<User> {
    const userId = req.user.userId;
    return await this.usersService.findById(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<User> {
    return await this.usersService.findById(id);
  }
}

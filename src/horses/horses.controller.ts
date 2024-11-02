import { Controller, Get } from '@nestjs/common';
import { HorsesService } from './horses.service';
import { Horse } from './horse.entity';

@Controller('horses')
export class HorsesController {
  constructor(private readonly horsesService: HorsesService) {}

  @Get()
  async findAll(): Promise<Horse[]> {
    return await this.horsesService.findAll();
  }
}

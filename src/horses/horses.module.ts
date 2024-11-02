import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorsesService } from './horses.service';
import { HorsesController } from './horses.controller';
import { Horse } from './horse.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Horse])],
  providers: [HorsesService],
  controllers: [HorsesController],
  exports: [HorsesService],
})
export class HorsesModule {}

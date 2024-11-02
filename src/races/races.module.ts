import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RacesService } from './races.service';
import { RacesController } from './races.controller';
import { Race } from './race.entity';
import { Round } from './round.entity';
import { Result } from './result.entity';
import { Horse } from '../horses/horse.entity';
import { EventsModule } from 'src/websockets/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Race, Round, Result, Horse]),
    EventsModule,
  ],
  providers: [RacesService],
  controllers: [RacesController],
  exports: [RacesService],
})
export class RacesModule {}

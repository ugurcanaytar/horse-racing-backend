import { Controller, Get, Param, Post } from '@nestjs/common';
import { RacesService } from './races.service';
import { Race } from './race.entity';
import { Result } from './result.entity';
import { Roles } from 'src/common/decorators/roles.decorator';

// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('races')
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  // @Get('current')
  // async getCurrentRace(): Promise<Race> {
  //   return await this.racesService.getCurrentRace();
  // }

  @Get('current')
  async getCurrentRace(): Promise<any> {
    const race = await this.racesService.getCurrentRace();

    // Manually break the circular reference
    const raceResponse = {
      id: race.id,
      rounds: race.rounds.map((round) => ({
        id: round.id,
        distance: round.distance,
        horses: round.horses.map((horse) => ({
          id: horse.id,
          name: horse.name,
          color: horse.color,
          condition: horse.condition,
        })),
      })),
      horses: race.horses.map((horse) => ({
        id: horse.id,
        name: horse.name,
        color: horse.color,
        condition: horse.condition,
      })),
    };

    return raceResponse;
  }

  @Get('results')
  async getResults(): Promise<Result[]> {
    const results = await this.racesService.getAllResults();
    return results;
  }

  @Roles('admin')
  @Post('generate')
  async generateRaceSchedule() {
    await this.racesService.generateRaceSchedule();
  }

  @Roles('admin')
  @Post('start')
  async startRace(): Promise<{ message: string }> {
    await this.racesService.toggleRace();
    return { message: 'Race started' };
  }

  @Roles('admin')
  @Post('pause')
  async pauseRace(): Promise<{ message: string }> {
    this.racesService.toggleRace();
    return { message: 'Race paused' };
  }

  @Roles('admin')
  @Post('toggle')
  async toggleRace(): Promise<{ message: string }> {
    this.racesService.toggleRace();
    return { message: 'Race Toggled' };
  }

  @Get(':id')
  async getRace(@Param('id') id: number): Promise<Race> {
    return await this.racesService.getRace(id);
  }
}

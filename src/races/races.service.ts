import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Horse } from 'src/horses/horse.entity';
import { Round } from './round.entity';
import { Race } from './race.entity';
import { Repository } from 'typeorm';
import { Result } from './result.entity';
import { EventsGateway } from '../websockets/events.gateway';

@Injectable()
export class RacesService {
  private readonly distances = [1200, 1400, 1600, 1800, 2000, 2200];
  private currentRace: Race;
  private raceState: 'stopped' | 'running' | 'paused' = 'stopped';
  private currentRoundIndex: number = 0;
  private positions: any[] = [];
  private currentRound: Round | null = null;

  constructor(
    @InjectRepository(Race)
    private raceRepository: Repository<Race>,
    @InjectRepository(Horse)
    private horseRepository: Repository<Horse>,
    @InjectRepository(Result)
    private resultRepository: Repository<Result>,
    private eventsGateway: EventsGateway,
  ) {}

  stopRace() {
    this.raceState = 'stopped';
    this.currentRoundIndex = 0;
    this.positions = [];
    this.currentRound = null;
    // Clear any running intervals or reset necessary properties here
  }

  // Generate the race program
  // async generateRaceSchedule(): Promise<Race> {
  //   const race = new Race();
  //   race.rounds = [];
  //   race.horses = [];

  //   const allHorses = await this.horseRepository.find();

  //   for (const distance of this.distances) {
  //     const round = new Round();
  //     round.distance = distance;

  //     // Randomly select 10 horses
  //     const selectedHorses = this.getRandomHorses(allHorses, 10);
  //     round.horses = selectedHorses;

  //     // Avoid duplicate horses in race.horses
  //     selectedHorses.forEach((horse) => {
  //       if (!race.horses.find((h) => h.id === horse.id)) {
  //         race.horses.push(horse);
  //       }
  //     });

  //     race.rounds.push(round);
  //   }

  //   this.currentRace = await this.raceRepository.save(race);
  //   return this.currentRace;
  // }

  async generateRaceSchedule(): Promise<any> {
    this.stopRace();
    // Step 1: Clear existing race data
    await this.resultRepository.query('TRUNCATE TABLE result CASCADE');
    await this.raceRepository.query('TRUNCATE TABLE round CASCADE');
    await this.raceRepository.query('TRUNCATE TABLE race CASCADE');
    await this.raceRepository.query(
      'TRUNCATE TABLE round_horses_horse CASCADE',
    );
    await this.raceRepository.query('TRUNCATE TABLE race_horses_horse CASCADE');

    // Step 3: Seed Horses
    const count = await this.horseRepository.count();
    if (count === 0) {
      await this.seedHorses();
    }

    // Step 4: Create a new race
    const race = new Race();
    race.rounds = [];
    race.horses = [];

    // Retrieve all horses from the database
    const allHorses = await this.horseRepository.find();

    // Generate rounds for each distance
    for (const distance of this.distances) {
      const round = new Round();
      round.distance = distance;

      // Randomly select 10 horses for this round
      const selectedHorses = this.getRandomHorses(allHorses, 10);
      round.horses = selectedHorses;
      round.race = race; // Establish the relationship between round and race

      // Add unique horses to the race's horses array
      selectedHorses.forEach((horse) => {
        if (!race.horses.find((h) => h.id === horse.id)) {
          race.horses.push(horse);
        }
      });

      race.rounds.push(round);
    }

    // Save the race to the database
    this.currentRace = await this.raceRepository.save(race);

    // Emit the programGenerated event to notify clients
    this.eventsGateway.server.emit('programGenerated');

    // Return the race object (circular reference will be broken in the controller)
    return this.currentRace;
  }

  // Method to seed the horses table
  private async seedHorses() {
    const colors = [
      'red',
      'blue',
      'green',
      'purple',
      'orange',
      'yellow',
      'pink',
      'teal',
      'brown',
      'navy',
      'maroon',
      'coral',
      'indigo',
      'turquoise',
      'violet',
      'gold',
      'silver',
      'olive',
      'crimson',
      'cyan',
    ];
    for (let i = 0; i < 20; i++) {
      const horse = this.horseRepository.create({
        name: `Horse ${i + 1}`,
        condition: Math.floor(Math.random() * 100) + 1,
        color: colors[i],
      });
      await this.horseRepository.save(horse);
    }
  }

  // Get the current race
  async getCurrentRace(): Promise<Race> {
    if (!this.currentRace) {
      await this.generateRaceSchedule();
    }
    return this.currentRace;
  }

  // Toggle race: start, pause, or resume
  async toggleRace() {
    if (this.raceState === 'running') {
      // Pause the race
      this.pauseRace();
    } else {
      // Start or resume the race
      if (this.raceState === 'stopped') {
        // Start a new race
        this.currentRoundIndex = 0;
        this.currentRace = await this.getCurrentRace();
      }
      this.raceState = 'running';
      this.runRounds();
    }
  }

  async getResultsForRound(roundId: number) {
    const results = await this.resultRepository.find({
      where: { round: { id: roundId } },
      relations: ['horse'],
    });

    return results.map((result) => ({
      horseId: result.horse.id,
      position: result.position,
      time: result.time,
    }));
  }

  // Pause the race
  private pauseRace() {
    if (this.raceState === 'running') {
      this.raceState = 'paused';
    }
  }

  // Run rounds sequentially
  private async runRounds() {
    while (this.currentRoundIndex < this.currentRace.rounds.length) {
      if (this.raceState === 'paused') {
        break; // Exit if the race is paused
      }

      const round = this.currentRace.rounds[this.currentRoundIndex];
      await this.simulateRound(round);
      this.currentRoundIndex++;

      // Emit results after each round
      this.eventsGateway.server.emit('raceResults', {
        roundId: round.id,
        results: await this.getResultsForRound(round.id),
      });
    }

    if (this.currentRoundIndex >= this.currentRace.rounds.length) {
      this.raceState = 'stopped'; // End the race if all rounds are completed
    }
  }

  // Simulate a single round
  private simulateRound(round: Round): Promise<void> {
    return new Promise((resolve) => {
      const positions = round.horses.map((horse) => ({
        id: horse.id,
        name: horse.name,
        color: horse.color,
        position: 0,
        condition: horse.condition,
        totalDistanceCovered: 0,
      }));

      const totalDistance = round.distance;
      const desiredRaceDuration = 10000; // Desired race duration in milliseconds (20 seconds)
      const updateInterval = 500; // Update every 500ms

      // Calculate the desired average speed to complete the race in the desired duration
      const desiredAverageSpeed = totalDistance / (desiredRaceDuration / 1000); // m/s

      const runInterval = async () => {
        while (positions.some((horse) => horse.position < 100)) {
          if (this.raceState === 'paused') {
            // Wait until the race is resumed
            await this.waitUntilResumed();
          }

          if (this.raceState !== 'running') {
            // If race is stopped, exit
            break;
          }

          positions.forEach((horsePosition) => {
            // Calculate speed based on condition and randomness
            const baseSpeed = desiredAverageSpeed; // Base speed in m/s
            const conditionFactor = horsePosition.condition / 100; // Normalize condition
            const randomFactor = Math.random() * 0.2 + 0.9; // Randomness between 0.9 and 1.1
            const speed = baseSpeed * conditionFactor * randomFactor; // Adjusted speed in m/s

            // Calculate distance covered during this interval
            const distanceCovered = (speed * updateInterval) / 1000; // Convert to meters per interval

            horsePosition.totalDistanceCovered += distanceCovered;

            // Calculate progress percentage
            horsePosition.position = Math.min(
              (horsePosition.totalDistanceCovered / totalDistance) * 100,
              100,
            );
          });

          // Emit raceUpdate event
          this.eventsGateway.server.emit('raceUpdate', {
            positions: positions,
            round: round.id,
            distance: round.distance,
          });

          await this.sleep(updateInterval);
        }

        if (this.raceState === 'running') {
          // Finish the round only if the race is running
          await this.finishRound(round, positions);
          resolve();
        }
      };

      runInterval();
    });
  }

  // Sleep helper function
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Wait until the race is resumed
  private waitUntilResumed() {
    return new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.raceState === 'running') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100); // Check every 100ms
    });
  }

  // Finish the round and save results
  private async finishRound(round: Round, positions: any[]) {
    // Assign times based on final positions
    const results: Result[] = positions.map((horsePosition) => {
      const horse = round.horses.find((h) => h.id === horsePosition.id);
      const time = this.calculateTime(horse.condition, round.distance);
      const result = new Result();
      result.horse = horse;
      result.time = time;
      result.round = round;
      return result;
    });

    // Sort results based on time
    results.sort((a, b) => a.time - b.time);

    // Assign positions
    results.forEach((result, index) => {
      result.position = index + 1;
    });

    // Save results
    await this.resultRepository.save(results);

    // Emit results via WebSocket
    this.eventsGateway.server.emit('raceResults', {
      roundId: round.id,
      results: results.map((res) => ({
        horseId: res.horse.id,
        position: res.position,
        time: res.time,
      })),
    });
  }

  // Calculate race time for a horse
  private calculateTime(condition: number, distance: number): number {
    const baseSpeed = 10; // Arbitrary base speed
    const conditionFactor = condition / 100; // Normalize condition
    const randomFactor = Math.random() * 0.1 + 0.95; // Randomness between 0.95 and 1.05

    return (distance / (baseSpeed * conditionFactor)) * randomFactor;
  }

  // Get random horses for a round
  private getRandomHorses(horses: Horse[], count: number): Horse[] {
    const shuffled = horses.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async getRace(id: number): Promise<Race> {
    return await this.raceRepository.findOne({
      where: { id },
      relations: [
        'rounds',
        'rounds.horses',
        'rounds.results',
        'rounds.results.horse',
      ],
    });
  }

  async getAllResults(): Promise<Result[]> {
    return await this.resultRepository.find({
      relations: ['horse', 'round'],
    });
  }
}

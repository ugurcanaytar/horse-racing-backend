import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Horse } from './horse.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HorsesService {
  constructor(
    @InjectRepository(Horse)
    private horseRepository: Repository<Horse>,
  ) {}

  async seedHorses() {
    // Delete existing races and related data
    await this.horseRepository.query('TRUNCATE TABLE result CASCADE');
    await this.horseRepository.query('TRUNCATE TABLE round CASCADE');
    await this.horseRepository.query('TRUNCATE TABLE race CASCADE');
    await this.horseRepository.query(
      'TRUNCATE TABLE round_horses_horse CASCADE',
    );
    await this.horseRepository.query(
      'TRUNCATE TABLE race_horses_horse CASCADE',
    );

    // await this.horseRepository.query(
    //   "SELECT setval(pg_get_serial_sequence('race', 'id'), 1, false)",
    // );
    // await this.horseRepository.query(
    //   "SELECT setval(pg_get_serial_sequence('round', 'id'), 1, false)",
    // );
    // await this.horseRepository.query(
    //   "SELECT setval(pg_get_serial_sequence('result', 'id'), 1, false)",
    // );

    const count = await this.horseRepository.count();
    if (count > 0) {
      return;
    }
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

  async findAll(): Promise<Horse[]> {
    return await this.horseRepository.find();
  }
}

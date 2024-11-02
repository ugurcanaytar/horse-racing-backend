import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Race } from './race.entity';
import { Horse } from '../horses/horse.entity';
import { Result } from './result.entity';

@Entity()
export class Round {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Race, (race) => race.rounds, { onDelete: 'CASCADE' })
  race: Race;

  @Column()
  distance: number; // 1200m, 1400m, etc.

  @ManyToMany(() => Horse)
  @JoinTable()
  horses: Horse[];

  @OneToMany(() => Result, (result) => result.round, { cascade: true })
  results: Result[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Horse } from '../horses/horse.entity';
import { Round } from './round.entity';

@Entity()
export class Race {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Round, (round) => round.race, { cascade: true })
  rounds: Round[];

  @ManyToMany(() => Horse)
  @JoinTable()
  horses: Horse[];
}

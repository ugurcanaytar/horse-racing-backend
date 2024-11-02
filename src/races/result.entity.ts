import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Round } from './round.entity';
import { Horse } from '../horses/horse.entity';

@Entity()
export class Result {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Round, (round) => round.results)
  round: Round;

  @ManyToOne(() => Horse)
  horse: Horse;

  @Column()
  position: number; // Finish position

  @Column('float')
  time: number; // Time taken to finish
}

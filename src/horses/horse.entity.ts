import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Horse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  condition: number; // Value between 1-100

  @Column()
  color: string; // Unique color identifier
}

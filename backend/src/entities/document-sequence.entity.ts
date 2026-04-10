import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('document_sequences')
export class DocumentSequence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('int', { default: 0 })
  currentValue: number;
}

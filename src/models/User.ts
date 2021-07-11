import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';

@Entity('users')
class User {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  nickname: string;

  @Column()
  email?: string;

  @Column()
  password: string;

  @Column({ type: 'varchar' })
  points: string | null;

  @Column({ type: 'varchar' })
  refresh_token: string | null;

  @UpdateDateColumn()
  last_modified: Date;

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export default User;

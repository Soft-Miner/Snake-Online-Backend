import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';

@Entity('password_reset_requests')
class PasswordResetRequest {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  user_id: string;

  @Column()
  request_secret: string;

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export default PasswordResetRequest;

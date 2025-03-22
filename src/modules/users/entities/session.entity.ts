import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity({ name: 'sessions' })
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tokenHash: string;

    @Column()
    deviceInfo: string;

    @Column()
    ipAddress: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    expiredAt: Date;

    @Column({ type: 'uuid', nullable: false })
    userId: string;

    @ManyToOne(() => User, user => user.sessions, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'userId' })
    user: User;
}
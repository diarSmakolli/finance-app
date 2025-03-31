import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { User } from "../users/entities/user.entity";

@Entity({ name: 'notifications' })
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    message: string;

    @Column()
    read: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'uuid', nullable: false })
    userId: string;

    @ManyToOne(() => User, user => user.sessions, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'userId' })
    user: User;
}
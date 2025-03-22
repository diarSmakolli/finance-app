import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity({ name: 'login_histories'})
export class LoginHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    ip: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    isp: string;

    @Column({ nullable: true })
    connectionType: string;

    @Column({ nullable: true })
    sourceApp: string;

    @Column({ nullable: true })
    deviceType: string;

    @Column({ nullable: true })
    deviceName: string;

    @Column({ nullable: true })
    os: string;

    @Column({ nullable: true })
    browser: string;

    @Column({ nullable: true })
    browserVersion: string;

    @CreateDateColumn()
    time: Date;

    @Column({ type: 'uuid', nullable: false })
    userId: string;

    @ManyToOne(() => User, user => user.loginHistories, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'userId' })
    user: User;

}
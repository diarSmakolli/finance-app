import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { LoginHistory } from "./loginhistory.entity";
import { Session } from "./session.entity";
import { Notification } from "src/modules/notifications/notification.entity";
import { Ticket } from "src/modules/ticket/entities/ticket.entity";
import { TicketMessage } from "src/modules/ticket/entities/ticket-massage.entity";

export enum Gender {
    MAN = 'Man',
    WOMAN = 'Woman',
    NON_BINARY = 'Non binary',
    S_E = 'Something else',
    PREFER_NOT_TO_SAY = 'Prefer not to say'
}

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true, nullable: true })
    username: string;

    @Column()
    password: string;

    @Column({ default: false })
    isSuspicious: boolean;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isBlocked: boolean;

    @Column({ default: false })
    hasAccess: boolean;

    @Column({ default: 'client' })
    role: string; // client, administration, sysadmin, infrastucture, wsadmin

    @Column({ nullable: true })
    lastLoginIp: string;

    @Column({ nullable: true })
    lastLoginCountry: string;

    @Column({ nullable: true })
    lastLoginCity: string;

    @Column({ nullable: true })
    lastLoginTime: Date;

    @Column({ default: 0})
    level: number;

    @Column({ default: 0})
    priority: number;

    @Column({ default: false })
    emailVerified: boolean;

    @Column({ type: 'varchar', nullable: true })
    emailVerificationToken: string | null;

    @Column({ type: 'timestamp', nullable: true })
    emailVerificationExpires: Date | null;

    @Column({ type: 'varchar', nullable: true })
    passwordResetToken: string | null;

    @Column({ type: 'timestamp', nullable: true })
    passwordResetExpires: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    profilePicture: string;

    @Column({ nullable: true })
    dateOfBirth: Date;

    @Column({
        type: 'enum',
        enum: Gender,
        default: Gender.PREFER_NOT_TO_SAY
    })
    gender: Gender;

    @Column({ nullable: true })
    provider: string;

    @Column({ nullable: true })
    providerId: string;  
    
    @Column({ nullable: true })
    oauthAccessToken: string;

    @Column({ nullable: true })
    oauthRefreshToken: string;
    
    @OneToMany(() => LoginHistory, loginHistory => loginHistory.user)
    loginHistories: LoginHistory[];

    @OneToMany(() => Session, session => session.user)
    sessions: Session[];

    @OneToMany(() => Notification, notification => notification.user)
    notifications: Notification[];

    @OneToMany(() => Ticket, ticket => ticket.user)
    tickets: Ticket[];

    // ✅ Tickets assigned to the user (as Manager)
    @OneToMany(() => Ticket, ticket => ticket.manager)
    assignedTickets: Ticket[];

    // ✅ Messages sent by the user in tickets
    @OneToMany(() => TicketMessage, message => message.sender)
    messages: TicketMessage[];
}

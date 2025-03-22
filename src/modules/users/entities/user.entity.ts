import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { LoginHistory } from "./loginhistory.entity";
import { Session } from "./session.entity";

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
    role: string;

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

    @Column({ nullable: true})
    emailVerificationToken: string;

    @Column({ nullable: true})
    emailVerificationExpires: Date;

    @Column({ nullable: true})
    passwordResetToken: string;

    @Column({ nullable: true})
    passwordResetExpires: Date;

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
    
    @OneToMany(() => LoginHistory, loginHistory => loginHistory.user)
    loginHistories: LoginHistory[];

    @OneToMany(() => Session, session => session.user)
    sessions: Session[];
}

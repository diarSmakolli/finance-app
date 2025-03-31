import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { TicketMessage } from "./ticket-massage.entity";

@Entity({ name: 'tickets' })
export class Ticket {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // manager ID
    @Column()
    department: string;

    @Column()
    category: string;

    @Column()
    subject: string;

    @Column()
    status: string; // ACTIVE, IN_PROGRESS, RESOLVED

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column()
    lastMessageAt: Date;

    // client, user who created ticket
    @Column({ type: 'uuid', nullable: false })
    userId: string;

    @ManyToOne(() => User, user => user.tickets, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'uuid', nullable: true })
    managerId: string;

    @ManyToOne(() => User, user => user.assignedTickets, { nullable: true })
    @JoinColumn({ name: 'managerId' })
    manager: User | null;

    // Ticket Messages
    @OneToMany(() => TicketMessage, message => message.ticket, { cascade: true })
    messages: TicketMessage[];
}
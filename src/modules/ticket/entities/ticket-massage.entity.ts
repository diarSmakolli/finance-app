import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    CreateDateColumn, 
    JoinColumn 
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Ticket } from "./ticket.entity";

@Entity({ name: 'ticket_messages' })
export class TicketMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    message: string;

    @Column('jsonb', { nullable: true })
    attachments: {
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        path: string;
    }[];

    @CreateDateColumn()
    createdAt: Date;

    // Sender of the message (User or Manager)
    @Column({ type: 'uuid', nullable: true  })
    senderId: string;

    @ManyToOne(() => User, user => user.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'senderId' })
    sender: User;

    // Link to Ticket
    @Column({ type: 'uuid' })
    ticketId: string;

    @ManyToOne(() => Ticket, ticket => ticket.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticketId' })
    ticket: Ticket;

    @Column({ default: false })
    isSystemMessage: boolean;

    @Column({ nullable: true })
    systemMessageType?: string;
}

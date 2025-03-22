import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EmailEvents } from "./email.events";

@Module({
    providers: [EmailService, EmailEvents],
    exports: [EmailService]
})
export class EmailModule {}
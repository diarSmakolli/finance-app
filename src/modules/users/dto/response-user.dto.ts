import { IsEmail, isEmail, IsNotEmpty, MinLength, IsOptional } from "class-validator";
import { User } from "../entities/user.entity";

export class ResponseUserDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    role: string;
    createdAt: Date;

    static fromEntity(user: User): ResponseUserDto {
        const dto = new ResponseUserDto();
        dto.id = user.id;
        dto.firstName = user.firstName;
        dto.lastName = user.lastName;
        dto.email = user.email;
        dto.isActive = user.isActive;
        dto.role = user.role;
        dto.createdAt = user.createdAt;
        return dto;
    }
}

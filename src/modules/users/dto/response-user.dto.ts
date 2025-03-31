import { IsEmail, IsNotEmpty, MinLength, IsOptional } from "class-validator";
import { User } from "../entities/user.entity";
import { Gender } from "../entities/user.entity";

export class ResponseUserDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    isSuspicious: boolean;
    isActive: boolean;
    isBlocked: boolean;
    hasAccess: boolean;
    role: string;
    lastLoginIp: string;
    lastLoginCountry: string;
    lastLoginCity: string;
    lastLoginTime: Date;
    level: number;
    priority: number;
    emailVerified: boolean;
    emailVerificationToken: string | null;
    emailVerificationExpires: Date | null;
    passwordResetToken: string | null;
    passwordResetExpires: Date | null;
    createdAt: Date;
    updatedAt: Date;
    profilePicture: string;
    dateOfBirth: Date;
    gender: Gender;
    loginHistories: any[];
    sessions: any[];

    static fromEntity(user: User): ResponseUserDto {
        const dto = new ResponseUserDto();
        dto.id = user.id;
        dto.firstName = user.firstName;
        dto.lastName = user.lastName;
        dto.email = user.email;
        dto.username = user.username;
        dto.isSuspicious = user.isSuspicious;
        dto.isActive = user.isActive;
        dto.isBlocked = user.isBlocked;
        dto.hasAccess = user.hasAccess;
        dto.role = user.role;
        dto.lastLoginIp = user.lastLoginIp;
        dto.lastLoginCountry = user.lastLoginCountry;
        dto.lastLoginCity = user.lastLoginCity;
        dto.lastLoginTime = user.lastLoginTime;
        dto.level = user.level;
        dto.priority = user.priority;
        dto.emailVerified = user.emailVerified;
        dto.emailVerificationToken = user.emailVerificationToken;
        dto.emailVerificationExpires = user.emailVerificationExpires;
        dto.passwordResetToken = user.passwordResetToken;
        dto.passwordResetExpires = user.passwordResetExpires;
        dto.createdAt = user.createdAt;
        dto.updatedAt = user.updatedAt;
        dto.profilePicture = user.profilePicture;
        dto.dateOfBirth = user.dateOfBirth;
        dto.gender = user.gender;
        dto.loginHistories = user.loginHistories;
        dto.sessions = user.sessions;
        return dto;
    }
}
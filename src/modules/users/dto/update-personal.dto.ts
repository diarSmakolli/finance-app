import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Gender } from '../entities/user.entity';

export class UpdatePersonalDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    profilePicture?: string;

    @IsDateString()
    @IsOptional()
    dateOfBirth?: Date;

    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;
}

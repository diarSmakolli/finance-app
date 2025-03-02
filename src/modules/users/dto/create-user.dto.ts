import { IsEmail, isEmail, IsNotEmpty, MinLength, IsOptional } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty({ message: 'First name is required.'})
    firstName: string;

    @IsNotEmpty({ message: 'Last name is required.'})
    lastName: string;

    @IsEmail()
    @IsNotEmpty({ message: 'Email is required.'})
    email: string;

    @IsNotEmpty({ message: 'Password is required.'})
    @MinLength(6, { message: 'Password must be at least 6 characters long.'})
    password: string;
}

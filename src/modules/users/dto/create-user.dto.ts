import { IsEmail, isEmail, IsNotEmpty, MinLength, IsOptional } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty()
    firstName: string;

    @IsNotEmpty({ message: 'Last name is required.'})
    lastName: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

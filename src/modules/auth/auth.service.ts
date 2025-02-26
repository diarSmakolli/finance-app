import { Injectable, ConflictException, UnauthorizedException, InternalServerErrorException, Res } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ResponseUserDto } from '../users/dto/response-user.dto';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService
    ) { }

    async signUp(userDto: CreateUserDto): Promise<any> {
        try {
            userDto.email = userDto.email.toLowerCase();

            const existingUserAccount = await this.userRepository.findOne({
                where: { email: userDto.email }
            });

            if(existingUserAccount) {
                throw new ConflictException('Account with this email already exist on our records.');
            }

            const hashedPassword = await bcrypt.hash(userDto.password, 10);

            const newUser = this.userRepository.create({
                ...userDto,
                password: hashedPassword,
                isSuspicious: false,
                isActive: true,
                isBlocked: false,
                role: 'client',
            });

            const savedUser = await this.userRepository.save(newUser);

            const userResponse = ResponseUserDto.fromEntity(savedUser);

            console.log("user Response: ", userResponse);

            return {
                success: true,
                code: '201',
                message: 'Account created successfully.',
                data: {
                    user: userResponse,
                },
            };
        } catch(error) {
            throw new InternalServerErrorException('Sign-up failed.');
        }
    }


}

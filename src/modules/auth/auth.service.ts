import { Injectable, ConflictException, UnauthorizedException, InternalServerErrorException, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ResponseUserDto } from '../users/dto/response-user.dto';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService
    ) { }

    async signUp(userDto: CreateUserDto): Promise<any> {
        userDto.email = userDto.email.toLowerCase();

        const existingUserAccount = await this.userRepository.findOne({
            where: { email: userDto.email }
        });

        if (existingUserAccount) {
            throw new ConflictException('Account with same email already exists on our records.');
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

        return {
            success: true,
            code: '201',
            message: 'Account created successfully.',
            data: {
                user: userResponse,
            },
        };
    }

    async signIn(email: string, password: string): Promise<any> {

        if(!email || !password) {
            throw new BadRequestException('Email and password are required.');
        }

        email = email.toLowerCase();

        const user = await this.userRepository.findOne({
            where: {
                email: email
            }
        });

        if(!user) {
            throw new NotFoundException('Account is not found in our records.');
        }

        if(user.isBlocked) {
            throw new UnauthorizedException(
                'Account is marked as blocked. Please contact support for more info.'
            );
        }

        if(user.isSuspicious) {
            throw new UnauthorizedException(
                `Account is marked as suspicious. Please contact support for more info.`
            );
        }

        if(!user.isActive) {
            throw new UnauthorizedException(
                'Account is marked as inactive. Please contact support for more info.'
            );
        }

        const isPasswordValidAndCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordValidAndCorrect) {
            throw new UnauthorizedException('Invalid credentials.');
        }

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        // const accessToken = this.jwtService.sign(payload);

        // res.cookie('accessToken', accessToken, {
        //     httpOnly: true,
        //     secure: false,
        //     sameSite: 'strict',
        //     maxAge: 3600000,
        // });

        return {
            status: 'success',
            code: '200',
            message: 'Logged in successfully.',
            data: {
                user: ResponseUserDto.fromEntity(user),
            }
        }
    }
}

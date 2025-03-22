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
import * as crypto from 'crypto';
import * as geoip from 'geoip-lite';
import { EmailService } from '../emailService/email.service';
import { Session } from '../users/entities/session.entity';
import { LoginHistory } from '../users/entities/loginhistory.entity';
import { CookieOptions } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        @InjectRepository(LoginHistory)
        private readonly loginHistoryRepository: Repository<LoginHistory>,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly eventEmitter: EventEmitter2,
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
            username: userDto.firstName.trim().toLowerCase() + userDto.lastName.trim().toLowerCase(),
        });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        
        newUser.emailVerificationToken = verificationToken;
        newUser.emailVerificationExpires = verificationExpires;

        const savedUser = await this.userRepository.save(newUser);

        const userResponse = ResponseUserDto.fromEntity(savedUser);


        this.eventEmitter.emit('email.welcome', {
            email: savedUser.email,
            firstName: savedUser.firstName
        });

        console.log("saved user email: ", savedUser.email);
        console.log("saved user first name: ", savedUser.firstName);

        return {
            success: true,
            code: '201',
            message: 'Account created successfully.',
            data: {
                user: userResponse,
            },
        };
    }

    async signIn(email: string, password: string, res: Response, req: Request): Promise<any> {
        if(!email || !password) {
            throw new BadRequestException('Email and password are required.');
        }

        email = email.toLowerCase();

        const user = await this.userRepository.findOne({
            where: {
                email: email
            },
        });

        if(!user) {
            throw new NotFoundException('Wrong credentials.');
        }

        if(user.isBlocked) {
            throw new UnauthorizedException(
                'Account is marked as inactive. Please contact support for more info.'
            );
        }

        if(user.isSuspicious) {
            throw new UnauthorizedException(
                `Account is marked as inactive. Please contact support for more info.`
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

        if(!user.emailVerified) {
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            user.emailVerificationToken = verificationToken;
            user.emailVerificationExpires = verificationExpires;

            await this.userRepository.save(user);
            
            this.eventEmitter.emit('email.verification', {
                email: user.email,
                token: verificationToken,
                firstName: user.firstName
            });

            throw new UnauthorizedException('Email for account verification has been sent.');
        }

        const currentIp = req.headers['x-forwarded-for']?.toString().split(',')[0] || 'Unknown IP';
        const deviceInfo = req.headers['user-agent'] || 'Unknown device';
        const geo = geoip.lookup(currentIp) || {};
        const currentTime = new Date().toISOString();

        const loginHistoryData = this.loginHistoryRepository.create({
            ip: currentIp,
            country: geo.country || 'Unknown',
            city: geo.city || 'Unknown',
            isp: geo.org || 'Unknown',
            connectionType: 'Unknown',
            sourceApp: 'web',
            deviceType: 'web',
            deviceName: deviceInfo,
            os: deviceInfo,
            browser: deviceInfo,
            browserVersion: deviceInfo,
            user: user
        });
        
        user.lastLoginIp = currentIp;
        user.lastLoginCountry = geo.country;
        user.lastLoginCity = geo.city;
        user.lastLoginTime = new Date();

        const existingLogin = await this.loginHistoryRepository.findOne({
            where: {
                userId: user.id,
                ip: currentIp,
                deviceName: deviceInfo
            }
        });

        if(!existingLogin) {
            this.eventEmitter.emit('login.new_device', {
                email: user.email,
                firstName: user.firstName,
                ip: currentIp,
                time: currentTime
            });
        }

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            hasAccess: user.hasAccess,
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 3600000,
        });

        const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');

        const session = this.sessionRepository.create({
            tokenHash,
            deviceInfo,
            ipAddress: currentIp,
            expiredAt: new Date(Date.now() + 60 * 60 * 1000), // 1hour
            user: user
        });

        await Promise.all([
            this.loginHistoryRepository.save(loginHistoryData),
            this.sessionRepository.save(session),
            this.userRepository.save(user)
        ]);

        return {
            status: 'success',
            code: '200',
            message: 'Logged in successfully.',
            data: {
                user: ResponseUserDto.fromEntity(user),
                token: accessToken
            }
        }
    }

    async signOut(req: Request & { cookies: { [key: string]: string } }, res: Response): Promise<any> {
        const token = req.cookies['accessToken'];
        
        if (token) {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            await this.sessionRepository.delete({ tokenHash });
        }

        const cookieOptions: CookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        };

        res.clearCookie('accessToken', cookieOptions);

        return {
            status: 'success',
            code: '200',
            message: 'Logged out successfully'
        };
    }

    async forgotPassword(email: string): Promise<any> {
        if(!email) {
            throw new BadRequestException('Email is mandatory field!');
        }

        const user = await this.userRepository.findOne({
            where: { email: email.toLowerCase() }
        });

        if(!user) {
            throw new NotFoundException('If your email is registered, you will receive password reset instructions.');
        }

        if(user.isBlocked || user.isSuspicious) {
            throw new NotFoundException('If your email is registered, you will receive password reset instructions.');
        }
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour


        user.passwordResetToken = resetTokenHash;
        user.passwordResetExpires = resetTokenExpires;

        await this.userRepository.save(user);

        // send reset email
        const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
        // await this.emailService.forgotPasswordEmail(
        //     user.email,
        //     resetLink,
        //     user.firstName
        // );

        this.eventEmitter.emit('email.forgot', {
            email: user.email,
            resetLink: resetLink,
            firstName: user.firstName
        });

        return {
            status: 'success',
            code: '200',
            message: 'If your email is registered, you will receive password reset instructions.'
        }
    }

}

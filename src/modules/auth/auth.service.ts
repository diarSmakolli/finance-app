import { 
    Injectable, ConflictException, UnauthorizedException, InternalServerErrorException, 
    Res, NotFoundException, BadRequestException 
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ResponseUserDto } from '../users/dto/response-user.dto';
import { User } from '../users/entities/user.entity';
import { Repository, MoreThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import * as crypto from 'crypto';
import * as geoip from 'geoip-lite';
import { EmailService } from '../emailService/email.service';
import { Session } from '../users/entities/session.entity';
import { LoginHistory } from '../users/entities/loginhistory.entity';
import { CookieOptions } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppLoggerService } from '../logger/logger.service';
import { Notification } from '../notifications/notification.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        @InjectRepository(LoginHistory)
        private readonly loginHistoryRepository: Repository<LoginHistory>,
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly eventEmitter: EventEmitter2,
        private readonly logger: AppLoggerService,
    ) { }

    async signUp(userDto: CreateUserDto): Promise<any> {
        this.logger.log('Starting processing request', 'AuthService.signUp');

        userDto.email = userDto.email.toLowerCase();

        const existingUserAccount = await this.userRepository.findOne({
            where: { email: userDto.email }
        });

        this.logger.debug(`Checking if the account already exist with email: ${userDto.email}`, 'AuthService.signUp');

        this.logger.debug(`Checking on the user dto data, ${userDto}`, 'AuthService.signUp');

        if (existingUserAccount) {
            this.logger.warn(`Account with email: ${userDto.email} already exists on system.`, 'AuthService.signUp');
            throw new ConflictException('Account already exists in our records with same email, try another or sign in please.');
        }

        const hashedPassword = await bcrypt.hash(userDto.password, 10);

        this.logger.debug(`Generating hashed password: ${hashedPassword} with algorithm 10 rounds.`, 'AuthService.signUp');

        const newUser = this.userRepository.create({
            ...userDto,
            password: hashedPassword,
            isSuspicious: false,
            isActive: true,
            isBlocked: false,
            role: 'client',
            username: userDto.firstName.trim().toLowerCase() + userDto.lastName.trim().toLowerCase(),
        });

        this.logger.debug(`trying to create user data to user repository: ${JSON.stringify(newUser)}`, 'AuthService.signUp');

        const savedUser = await this.userRepository.save(newUser);

        const userResponse = ResponseUserDto.fromEntity(savedUser);

        this.logger.debug(`
            convert user response from repository data to dto using 
            ResponseUserDto.fromEntity(savedUser), ${userResponse}`, 
            'AuthService.signUp'
        );

        this.eventEmitter.emit('email.welcome', {
            email: savedUser.email,
            firstName: savedUser.firstName
        });

        this.logger.debug(`
            Created event for eventEmitter with name 'email.welcome' to 
            send email to client welcome email and send
            in payload email: ${savedUser.email}, and first name: ${savedUser.firstName}`, 
            'AuthService.signUp'
        );

        this.logger.log(`Created user account and send email: ${savedUser.email}`, 'AuthService.signUp');

        return {
            success: true,
            code: '201',
            message: 'Account created successfully.',
            data: {
                user: userResponse,
            },
        };
    };

    async signIn(email: string, password: string, res: Response, req: Request): Promise<any> {
        this.logger.log('Start processing request.', 'AuthService.signIn');

        if(!email || !password) {
            this.logger.warn(`Email or password is missing.`, 'AuthService.signIn');
            throw new BadRequestException('Email and password are required.');
        }

        email = email.toLowerCase();

        this.logger.debug(`Converting email to lowercase if client sends on wrong format: ${email}`, 'AuthService.signIn');

        const user = await this.userRepository.findOne({
            where: {
                email: email
            },
        });

        if(!user) {
            this.logger.warn(`user not found with email: ${email}.`, 'AuthService.signIn');
            throw new NotFoundException('Incorrect email or password, please try again.');
        }

        if(user.isBlocked) {
            this.logger.warn(`Account with email: ${email} is marked as blocked, user.isBlocked: ${user.isBlocked}`, 'AuthService.signIn');
            throw new UnauthorizedException(
                'Your account has been locked due to restrictions of our policy. Please contact support for more details.'
            );
        }

        if(user.isSuspicious) {
            this.logger.warn(`Account with email: ${email} is marked as suspicious, user.isSuspicious: ${user.isSuspicious}.`, 'AuthService.signIn');
            throw new UnauthorizedException(
                `Your account has been locked due to restrictions of our policy. Please contact support for more details.`
            );
        }

        if(!user.isActive) {
            this.logger.warn(`Account with email: ${email} is marked as inactive, user.isActive: ${user.isActive}`, 'AuthService.signIn');
            throw new UnauthorizedException(
                'Your account has been locked due to restrictions of our policy. Please contact support for more details.'
            );
        }

        const isPasswordValidAndCorrect = await bcrypt.compare(password, user.password);

        this.logger.debug(`Checking if the password provided by user and password in the database compares, isPasswordValidAndCorrect: ${isPasswordValidAndCorrect}`, 'AuthService.signIn');

        if(!isPasswordValidAndCorrect) {
            this.logger.warn(`Password provided by user: ${password} is not equals with password compares using bcrypt in the storage.`, 'AuthService.signIn');
            throw new UnauthorizedException('Incorrect email or password, please try again.');
        }

        if(!user.emailVerified) {
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            this.logger.debug(`
                Account of the user is not verified, generating verification tokens,
                verification Token: ${verificationToken},
                verificationTokenHash - hashed: ${verificationTokenHash},
                verificationExpires - expire time: ${verificationExpires}
                `, 'AuthService.signIn'
            );

            user.emailVerificationToken = verificationTokenHash;
            user.emailVerificationExpires = verificationExpires;

            await this.userRepository.save(user);
            
            this.eventEmitter.emit('email.verification', {
                email: user.email,
                token: verificationToken,
                firstName: user.firstName
            });

            this.logger.debug(`Event created 'email.verificaiton' to send email asynchrynously using event emmiter and
                provided payload data: email: ${user.email}, token: ${verificationToken}, firstName: ${user.firstName}`,
                'AuthService.signIn'
            );

            throw new UnauthorizedException('Email for account verification has been sent.');
        }

        const currentIp = req.headers['x-forwarded-for']?.toString().split(',')[0] || 'Unknown IP';
        const deviceInfo = req.headers['user-agent'] || 'Unknown device';
        const geo = geoip.lookup(currentIp) || {};
        const currentTime = new Date().toISOString();

        this.logger.debug(`
            Generating data for tracking user actions:
            currentIp: ${currentIp}, device info: ${deviceInfo}, geo: ${geo},
            current time: ${currentTime}
        `, 'AuthService.signIn');

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

        this.logger.debug(`Created loginHistory data: ${JSON.stringify(loginHistoryData)}`, 'AuthService.signIn');
        
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
            this.logger.log(`Login from new device comes for user with email: ${email}, created new event for notify user 'login.new_device'.`, 'AuthService.signIn');
            const newNotification = this.notificationRepository.create({
                title: "New device detected",
                message: `New Device Detected for your account from IP address: ${currentIp} on ${currentTime}. If this wasn't you please secure your account immediately.`,
                read: false,
                userId: user.id,
            });
            
            await this.notificationRepository.save(newNotification);

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

        this.logger.log(`generating payload for access token with properties: id, email, role and hasAccess.`, 'AuthService.signIn');

        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

        this.logger.debug(`Access token generated: ${accessToken}, and expires in 1 hour.`, 'AuthService.signIn');

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 3600000,
        });

        this.logger.debug(`Assign the token to res.cookie and make expired in 1 hour after it generated.`, 'AuthService.signIn');

        const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');

        this.logger.debug(`Generating and hashing the token generated using sha256 algo: ${tokenHash}.`, 'AuthService.signIn');

        const session = this.sessionRepository.create({
            tokenHash,
            deviceInfo,
            ipAddress: currentIp,
            expiredAt: new Date(Date.now() + 60 * 60 * 1000), // 1hour
            user: user
        });

        this.logger.debug(`
            Create session data to repository, tokenHash: ${session.tokenHash}, deviceInfo: ${session.deviceInfo}, ipAddress: ${session.ipAddress}, 
            expiredAt: ${session.expiredAt}, user: ${session.user}`,
            'AuthService.signIn'
        );

        await Promise.all([
            this.loginHistoryRepository.save(loginHistoryData),
            this.sessionRepository.save(session),
            this.userRepository.save(user),
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
    };

    async signOut(req: Request & { cookies: { [key: string]: string } }, res: Response): Promise<any> {
        this.logger.log(`Start processing request.`, 'AuthService.signOut');
        const token = req.cookies['accessToken'];

        this.logger.debug(`trying to get token from request cookies with name accessToken: ${token}`, 'AuthService.signOut');
        
        if (token) {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            
            this.logger.debug(`
                Hashed the token with sha256 if it compares or equals with saved on database delete it using tokenhash,
                original jwt token: ${token}, hashed token: ${tokenHash}.`, 'AuthService.signOut');

            await this.sessionRepository.delete({ tokenHash });
        }

        const cookieOptions: CookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        };

        res.clearCookie('accessToken', cookieOptions);

        this.logger.debug(`Clearing accessToken from request cookies using res.clearCookies('accessToken', cookieOptions);`, 'AuthService.signOut');

        return {
            status: 'success',
            code: '200',
            message: 'Signed out successfully.'
        };
    };

    async forgotPassword(email: string): Promise<any> {
        this.logger.log(`Start processing request.`, 'AuthService.forgotPassword');

        if(!email) {
            this.logger.warn(`Email is not provided: ${email}.`, 'AuthService.forgotPassword');
            throw new BadRequestException('Email is required.');
        }

        const user = await this.userRepository.findOne({
            where: { email: email.toLowerCase() }
        });

        if(!user) {
            this.logger.warn(`Account with email: ${email} not found in our system or records.`, 'AuthService.forgotPassword')
            throw new NotFoundException('If your email is registered, you will receive password reset instructions.');
        }

        if(user.isBlocked) {
            this.logger.warn(`Account with email: ${email} is marked as blocked, user.isBlocked: ${user.isBlocked}`, 'AuthService.forgotPassword');
            throw new UnauthorizedException(
                'Your account has been locked due to restrictions of our policy. Please contact support for more details.'
            );
        }

        if(user.isSuspicious) {
            this.logger.warn(`Account with email: ${email} is marked as suspicious, user.isSuspicious: ${user.isSuspicious}.`, 'AuthService.forgotPassword');
            throw new UnauthorizedException(
                `Your account has been locked due to restrictions of our policy. Please contact support for more details.`
            );
        }

        if(!user.isActive) {
            this.logger.warn(`Account with email: ${email} is marked as inactive, user.isActive: ${user.isActive}`, 'AuthService.forgotPassword');
            throw new UnauthorizedException(
                'Your account has been locked due to restrictions of our policy. Please contact support for more details.'
            );
        }
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        this.logger.debug(`
            Generated resetoken: ${resetToken} an original token using 32 bytes,
            reset token hash: ${resetTokenHash} -> using the sha256 algorithm,
            reset token expires: ${resetTokenExpires}
            `, 'AuthService.forgotPassword');

        user.passwordResetToken = resetTokenHash;
        user.passwordResetExpires = resetTokenExpires;

        await this.userRepository.save(user);

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        this.logger.debug(`Generated the reset link: ${resetLink}`, 'AuthService.forgotPassword');

        this.eventEmitter.emit('email.forgot', {
            email: user.email,
            resetLink: resetLink,
            firstName: user.firstName
        });

        this.logger.debug(`
            Event created email.forgot using eventEmmiter: and saving email: ${user.email}, resetLink: ${resetLink}, 
            firstName: ${user.firstName} in payload.`, 'AuthService.forgotPassword.'
        );

        return {
            status: 'success',
            code: '200',
            message: 'If your email is registered, you will receive password reset instructions.'
        }
    };

    async resetPassword(token: string, password: string): Promise<any> {
        this.logger.log(`Start processing request.`, 'AuthService.resetPassword');

        if(!token || !password) {
            this.logger.warn(`token and password is not provided: ${token}, ${password}`, 'AuthService.resetPassword');
            throw new BadRequestException('Link has been expired or invalid, please check carefully the link!');
        }

        const resetTokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        this.logger.debug(
            `
                Hashing token from requst to compare with token in database createHash('sha256').update(token),
                reset token hash: ${resetTokenHash}, original token: ${token}
            `, 'AuthService.resetPassword'
        );

        const user = await this.userRepository.findOne({
            where: {
                passwordResetToken: resetTokenHash,
                passwordResetExpires: MoreThan(new Date()),
            }
        });

        if (!user) {
            this.logger.warn(`user not found with reset token: ${resetTokenHash}, password expires: ${MoreThan(new Date())}`, 'AuthService.resetPassword');
            throw new BadRequestException(`Link has expired, please try again.`);
        }

        if(user.isBlocked) {
            this.logger.warn(`Account is marked as blocked, user.isBlocked: ${user.isBlocked}`, 'AuthService.resetPassword');
            throw new UnauthorizedException(
                'Link has expired, please try again.'
            );
        }

        if(user.isSuspicious) {
            this.logger.warn(`Account is marked as suspicious, user.isSuspicious: ${user.isSuspicious}.`, 'AuthService.resetPassword');
            throw new UnauthorizedException(
                `Link has expired, please try again.`
            );
        }

        if(!user.isActive) {
            this.logger.warn(`Account is marked as inactive, user.isActive: ${user.isActive}`, 'AuthService.resetPassword');
            throw new UnauthorizedException(
                'Link has expired, please try again.'
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        this.logger.debug(`Hashing the password using 10 rounds usi ng bcrypt: ${hashedPassword}`, 'AuthService.resetPassword');
        
        user.password = hashedPassword;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;

        await this.userRepository.save(user);
        await this.sessionRepository.delete({ userId: user.id });
        

        this.eventEmitter.emit('email.password_changed', {
            email: user.email,
            firstName: user.firstName
        });

        const newNotification = this.notificationRepository.create({
            title: "Your password has been changed",
            message: `This confirms that your password has been changed. If you did not make thins change, please contact our support team immediately.`,
            read: false,
            userId: user.id,
        });

        await this.notificationRepository.save(newNotification);

        this.logger.debug(`
            Saved password as hashed password: ${hashedPassword}, and make empty passwordResetToken, and passwordResetExpires,
            save in the user repository and delete all the sessions with the same user id.
            `, 'AuthService.resetPassword');

        this.logger.debug(`Event created email.password_changed with payload data: email: ${user.email}, firstName: ${user.firstName}`, 'AuthService.resetPassword');

        return {
            status: 'success',
            code: '200',
            message: 'Password has been reset successfully'
        };
    };

    async verifyAccount(token: string): Promise<any>  {
        this.logger.log(`Start processin request.`, 'AuthService.verifyAccount');

        if (!token) {
            this.logger.warn(`token is not provided, token: ${token}`, 'AuthService.verifyAccount');
            throw new BadRequestException('Link has been expired!');
        }

        const verificationTokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        this.logger.debug(`re-hashing the verification token hash: ${verificationTokenHash} to check if the same as in database.`, 'AuthService.verifyAccount');

        const user = await this.userRepository.findOne({
            where: {
                emailVerificationToken: verificationTokenHash,
                emailVerificationExpires: MoreThan(new Date()),
                isActive: true
            }
        });

        if (!user || user.isBlocked || user.isSuspicious || !user.isActive) {
            this.logger.warn(
                `user not found with emailVerificationToken: ${verificationTokenHash}, or emailVerificationExpirse more than new date, and
                isActive true, or user is blocked, or user is suspicious: ${JSON.stringify(user)}
                `, 'AuthService.verifyAccount'
            );
            throw new NotFoundException(
                'Your email verification cannot be processed. Please make sure the link is correct and is not expired!'
            );
        }

        const newNotification = this.notificationRepository.create({
            title: "Account verified",
            message: `This confirm that your account has been successfully verified.`,
            read: false,
            userId: user.id,
        });

        await this.notificationRepository.save(newNotification);

        user.emailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;

        await this.userRepository.save(user);

        return {
            status: 'success',
            code: '200',
            message: `You're all set, your account has been successfully verified!`
        };
    };

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<any> {
        this.logger.log(
            `Starting processing request.`, 'AuthService.changePassword'
        );

        this.logger.debug(
            `
                user id: ${userId}, current password: ${currentPassword}, newPassword: ${newPassword}.
            `, 'AuthService.changePassword'
        )

        if (!currentPassword || !newPassword) {
            this.logger.warn(`Current password: ${currentPassword} or new password: ${newPassword} missing.`, 'AuthService.changePassword');
            throw new BadRequestException('Current password and new password are required.');
        }

        const user = await this.userRepository.findOne({
            where: { 
                id: userId,
                isActive: true,
                isBlocked: false,
                isSuspicious: false
            }
        });

        if (!user) {
            this.logger.warn(`user not found with user id: ${userId}, isActive: true, isBlocked: false, and isSupsicious: false.`, 'AuthService.changePassword');
            throw new NotFoundException('Cannot process this request at this time, please try again later.', 'AuthService.changePassword');
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
            this.logger.warn(`current password: ${currentPassword} is not equals to user password: ${user.password}.`, 'AuthService.changePassword');
            throw new UnauthorizedException('Current password is incorrect!');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        this.logger.debug(`Hashing password: ${hashedPassword} and saving in password property.`, 'AuthService.changePassword');

        await Promise.all([
            this.userRepository.save(user),
            this.sessionRepository.delete({ userId: user.id })
        ]);

        this.eventEmitter.emit('email.password_changed', {
            email: user.email,
            firstName: user.firstName
        });

        const newNotification = this.notificationRepository.create({
            title: "Your password has been changed",
            message: `This confirms that your password has been changed. If you did not make thins change, please contact our support team immediately.`,
            read: false,
            userId: user.id,
        });

        await this.notificationRepository.save(newNotification);

        this.logger.debug(`
            Created event at event emmiter email.password_changed to notify the user for password changed.
            put in payload data, email: ${user.email}, firstName: ${user.firstName}.`, 'AuthService.changePassword');

        return {
            status: 'success',
            code: '200',
            message: 'Password changed successfully. Please login again.'
        };
    }; 
}

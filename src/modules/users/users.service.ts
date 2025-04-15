import { Injectable, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UpdatePersonalDto } from './dto/update-personal.dto';
import * as bcrypt from 'bcrypt';
import { createReadStream } from 'fs';
import { join } from 'path';
import { AppLoggerService } from '../logger/logger.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { Session } from './entities/session.entity';
import { LoginHistory } from './entities/loginhistory.entity';

@Injectable()
export class UsersService {
  private multerOptions = {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads/profile-pictures';
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `profile-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        cb(new BadRequestException('Only image files (jpg, jpeg, png, gif) are allowed.'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 1024 * 1024 * 5 // 5MB
    }
  };

  getMulterConfig() {
    return this.multerOptions;
  }

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(LoginHistory)
    private readonly loginHistoryRepository: Repository<LoginHistory>,
    private readonly logger: AppLoggerService,
  ) { 
    this.initializeQueue();
  }

  private async initializeQueue() {
    
    this.logger.log('Queue initialized and cleaned', 'UsersService');
}

  // UPDATE USER PERSONAL DATA
  async updatePersonal(userId: string, updateDto: UpdatePersonalDto): Promise<ResponseUserDto> {
    this.logger.log(`Start processing request.`, 'UsersService.updatePersonal');

    const user = await this.usersRepository.findOne({
      where: { id: userId }
    });

    this.logger.debug(`Trying to get user with userId: ${userId}, updateDto: ${JSON.stringify(updateDto)}.`,
      'UsersService.updatePersonal');

    if (!user) {
      this.logger.warn(`User with id: ${userId} not found on system.`, 'UsersService.updatePersonal');
      throw new NotFoundException('Cannot process this request at this time, please try again later!');
    }

    if (user.isBlocked) {
      this.logger.warn(`Account is marked as blocked, user.isBlocked: ${user.isBlocked}`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        'Cannot process this request at this time, please try again later!'
      );
    }

    if (user.isSuspicious) {
      this.logger.warn(`Account is marked as suspicious, user.isSuspicious: ${user.isSuspicious}.`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        `Cannot process this request at this time, please try again later!`
      );
    }

    if (!user.isActive) {
      this.logger.warn(`Account is marked as inactive, user.isActive: ${user.isActive}`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        'Cannot process this request at this time, please try again later!'
      );
    }

    Object.assign(user, updateDto);

    const updatedUser = await this.usersRepository.save(user);
    return ResponseUserDto.fromEntity(updatedUser);
  }

  // GET DETAILS OF A USER
  async getPersonalById(userId: string): Promise<ResponseUserDto> {
    this.logger.log(`Start processing request.`, 'UsersService.getPersonalById');

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    this.logger.debug(`Try to find user with user id: ${userId}.`, 'UsersService.getPersonalById');


    if (!user) {
      this.logger.warn(`User with id: ${userId} not found on system.`, 'UsersService.updatePersonal');
      throw new NotFoundException('Cannot process this request at this time, please try again later!');
    }

    if (user.isBlocked) {
      this.logger.warn(`Account is marked as blocked, user.isBlocked: ${user.isBlocked}`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        'Cannot process this request at this time, please try again later!'
      );
    }

    if (user.isSuspicious) {
      this.logger.warn(`Account is marked as suspicious, user.isSuspicious: ${user.isSuspicious}.`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        `Cannot process this request at this time, please try again later!`
      );
    }

    if (!user.isActive) {
      this.logger.warn(`Account is marked as inactive, user.isActive: ${user.isActive}`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        'Cannot process this request at this time, please try again later!'
      );
    }

    return ResponseUserDto.fromEntity(user);
  }

  // UPLOAD PROFILE PICTURE
  async uploadProfilePicture(userId: string, file: Express.Multer.File): Promise<ResponseUserDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      this.logger.warn(`User with id: ${userId} not found on system.`, 'UsersService.updatePersonal');
      throw new NotFoundException('Cannot process this request at this time, please try again later!');
    }

    if (user.isBlocked) {
      this.logger.warn(`Account is marked as blocked, user.isBlocked: ${user.isBlocked}`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        'Cannot process this request at this time, please try again later!'
      );
    }

    if (user.isSuspicious) {
      this.logger.warn(`Account is marked as suspicious, user.isSuspicious: ${user.isSuspicious}.`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        `Cannot process this request at this time, please try again later!`
      );
    }

    if (!user.isActive) {
      this.logger.warn(`Account is marked as inactive, user.isActive: ${user.isActive}`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        'Cannot process this request at this time, please try again later!'
      );
    }

    // Save file path to user profile
    user.profilePicture = `profile-pictures/${file.filename}`;

    const updatedUser = await this.usersRepository.save(user);
    return ResponseUserDto.fromEntity(updatedUser);
  }

  // GET/READ PROFILE PICTURE ON PREVIEW
  async getProfilePicture(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId }
    });

    if (!user || !user.profilePicture) {
      throw new NotFoundException('Profile picture not found');
    }

    if (user.isBlocked) {
      this.logger.warn(`Account is marked as blocked, user.isBlocked: ${user.isBlocked}`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        'Cannot process this request at this time, please try again later!'
      );
    }

    if (user.isSuspicious) {
      this.logger.warn(`Account is marked as suspicious, user.isSuspicious: ${user.isSuspicious}.`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        `Cannot process this request at this time, please try again later!`
      );
    }

    if (!user.isActive) {
      this.logger.warn(`Account is marked as inactive, user.isActive: ${user.isActive}`, 'AuthService.resetPassword');
      throw new UnauthorizedException(
        'Cannot process this request at this time, please try again later!'
      );
    }

    const filePath = join(process.cwd(), 'uploads', user.profilePicture);
    return createReadStream(filePath);
  }

  // GET ACTIVE SESSIONS
  async getActiveSessions(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{
    status: string;
    code: string;
    message: string;
    data: {
      sessions: any[];
      total: number;
      pages: number;
      currentPage: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = options;
  
    this.logger.log(`Start processing request.`, 'UsersService.getActiveSessions');
  
    const user = await this.usersRepository.findOne({
      where: { id: userId }
    });
  
    if (!user) {
      this.logger.warn(`User with id ${userId} not found.`, 'UsersService.getActiveSessions');
      throw new NotFoundException('Cannot process this request at this time, please try again later!');
    }
  
    if (!user.isActive || user.isBlocked || user.isSuspicious) {
      this.logger.warn(
        `User ${userId} status check failed: isActive=${user.isActive}, isBlocked=${user.isBlocked}, isSuspicious=${user.isSuspicious}`,
        'UsersService.getActiveSessions'
      );
      throw new UnauthorizedException('Cannot process this request at this time, please try again later!');
    }
  
    const [sessions, total] = await this.sessionRepository.findAndCount({
      where: {
        userId: user.id,
        expiredAt: MoreThan(new Date())
      },
      order: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    });
  
    const pages = Math.ceil(total / limit);
  
    this.logger.debug(
      `Found ${sessions.length} active sessions (total: ${total}) for user ${userId}`,
      'UsersService.getActiveSessions'
    );
  
    return {
      status: 'success',
      code: '200',
      message: 'Active sessions retrieved successfully',
      data: {
        sessions,
        total,
        pages,
        currentPage: page
      }
    };
  }

  // GET LOGIN HISTORY
  async getLoginHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{
    status: string;
    code: string;
    message: string;
    data: {
      loginhistories: any[];
      total: number;
      pages: number;
      currentPage: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'time',
      sortOrder = 'DESC'
    } = options;
  
    this.logger.log(`Start processing request.`, 'UsersService.getLoginHistory');
  
    const user = await this.usersRepository.findOne({
      where: { id: userId }
    });
  
    if (!user) {
      this.logger.warn(`User with id ${userId} not found.`, 'UsersService.getLoginHistory');
      throw new NotFoundException('Cannot process this request at this time, please try again later!');
    }
  
    if (!user.isActive || user.isBlocked || user.isSuspicious) {
      this.logger.warn(
        `User ${userId} status check failed: isActive=${user.isActive}, isBlocked=${user.isBlocked}, isSuspicious=${user.isSuspicious}`,
        'UsersService.getLoginHistory'
      );
      throw new UnauthorizedException('Cannot process this request at this time, please try again later!');
    }
  
    const [loginhistories, total] = await this.loginHistoryRepository.findAndCount({
      where: {
        userId: user.id,
      },
      order: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    });
  
    const pages = Math.ceil(total / limit);
  
    this.logger.debug(
      `Found ${loginhistories.length} active login histories (total: ${total}) for user ${userId}`,
      'UsersService.getLoginHistory'
    );
  
    return {
      status: 'success',
      code: '200',
      message: 'Login histories retrieved successfully',
      data: {
        loginhistories,
        total,
        pages,
        currentPage: page
      }
    };
  }
  
  // TERMINATE SESSION
  async terminateSession(userId: string, sessionId: string) {
    this.logger.log('Starting session termination request', 'UsersService.terminateSession');

    const user = await this.usersRepository.findOne({
        where: { id: userId }
    });

    if (!user) {
        this.logger.warn(`User not found with id: ${userId}`, 'UsersService.terminateSession');
        throw new NotFoundException('Cannot process this request at this time, please try again later!');
    }

    if (!user.isActive || user.isBlocked || user.isSuspicious) {
      this.logger.warn(
          `User ${userId} status check failed: isActive=${user.isActive}, isBlocked=${user.isBlocked}, isSuspicious=${user.isSuspicious}`,
          'UsersService.getActiveSessions'
      );
      throw new UnauthorizedException('Cannot process this request at this time, please try again later!');
  }


    const session = await this.sessionRepository.findOne({
        where: {
            id: sessionId,
            userId: user.id
        }
    });

    if (!session) {
        this.logger.warn(`Session ${sessionId} not found for user ${userId}`, 'UsersService.terminateSession');
        throw new NotFoundException('No sessions has been found in our records.');
    }

    await this.sessionRepository.remove(session);
    
    this.logger.debug(`Session ${sessionId} terminated successfully`, 'UsersService.terminateSession');

    return {
        status: 'success',
        code: '200',
        message: 'Session terminated successfully.'
    };
  }

  // DEACTIVATE ACCOUNT
  async deActivateAccount(userId: string): Promise<any> {
    this.logger.log(`Start processing request.`, 'UsersService.deActivateAccount');

    const user = await this.usersRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      this.logger.warn(`User with id ${userId} not found.`, 'UsersService.deActivateAccount');
      throw new NotFoundException('Cannot process this request at this time, please try again later!');
    }

    if (!user.isActive || user.isBlocked || user.isSuspicious) {
      this.logger.warn(
        `User ${userId} status check failed: isActive=${user.isActive}, isBlocked=${user.isBlocked}, isSuspicious=${user.isSuspicious}`,
        'UsersService.deActivateAccount'
      );
      throw new UnauthorizedException('Cannot process this request at this time, please try again later!');
    }

    user.isActive = false;
    await this.usersRepository.save(user);

    return {
      status: 'success',
      code: '200',
      message: 'Account deactivated successfully.'
    };
  }

  


}

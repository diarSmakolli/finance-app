import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { Session } from '../users/entities/session.entity';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly logger: AppLoggerService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Session) private readonly sessionRepository: Repository<Session>,
    
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const token = request.cookies['accessToken'];

    this.logger.log(`Process function authguard canActive, request: ${request}, response: ${response}, token: ${token}`, 'AuthGuard.canActivate');

    if (!token) {
      this.logger.warn(`Token -> ${token} is not provided.`, 'AuthGuard.canActivate');
      throw new UnauthorizedException('Unauthorized');
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cdc123') as { id: string, email: string };

      this.logger.debug(`Decoded: ${decoded}`, 'AuthGuard.canActivate');

      const user = await this.userRepository.findOne({ 
        where: { id: decoded.id },
      });

      this.logger.debug(`Get user information data from the decoded.id: ${decoded.id}`, 'AuthGuard.canActivate');

      if (!user || user.isBlocked || user.isSuspicious) {
        this.logger.warn(`user with id: ${decoded.id} is not found.`, 'AuthGuard.canActivate');
        throw new UnauthorizedException('Unauthorized.');
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      this.logger.debug(`check if the token from the cookies have tokenhash on the session on database, token original: ${token},
        token hash database: ${tokenHash}.`, 'AuthGuard.canActivate');

      const session = await this.sessionRepository.findOne({
        where: {
          tokenHash: tokenHash,
          userId: user.id,
          expiredAt: MoreThan(new Date())
        }
      });

      this.logger.debug(`get the session where user id: ${user.id} and token hash: ${tokenHash} and expired at is beofre: ${MoreThan(new Date())}`, 'AuthGuard.canActivate');

      if(!session) {
        response.clearCookie('accessToken');
        this.logger.debug(`if session fails, we need to clear/remove accessToken from the cookies.`, 'AuthGuard.canActivate');
        throw new UnauthorizedException('Session expired or invalid.');
      }

      request.user = user;
      return true;
    } catch (error) {
      this.logger.error(`Unhandled exception: ${error}`, 'AuthGuard.canActivate');
      throw new InternalServerErrorException('Unauthorized.');
    }
  }
}

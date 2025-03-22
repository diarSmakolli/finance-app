import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { Session } from '../users/entities/session.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Session) private readonly sessionRepository: Repository<Session>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const token = request.cookies['accessToken'];

    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cdc123') as { id: string, email: string };
      const user = await this.userRepository.findOne({ 
        where: { id: decoded.id },
      })

      if (!user) {
        throw new UnauthorizedException('Unauthorized.');
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const session = await this.sessionRepository.findOne({
        where: {
          tokenHash: tokenHash,
          userId: user.id,
          expiredAt: MoreThan(new Date())
        }
      });

      if(!session) {
        response.clearCookie('accessToken');
        throw new UnauthorizedException('Session expired or invalid.');
      }

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Unauthorized.');
    }
  }
}

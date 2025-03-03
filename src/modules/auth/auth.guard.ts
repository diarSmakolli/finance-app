import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies['accessToken'];

    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey') as { email: string };
      const user = await this.userRepository.findOne({ where: { email: decoded.email } });

      if (!user) {
        throw new UnauthorizedException('Unauthorized.');
      }

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Unauthorized.');
    }
  }
}

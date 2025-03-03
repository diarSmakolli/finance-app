import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";   
import { User } from "../users/entities/user.entity";
import * as dotenv from "dotenv";

dotenv.config();

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const token = req.cookies['accessToken'];

        if (!token) {
            return res.status(401).json({
                success: false,
                code: '401',
                message: 'Unauthorized.',
            });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return res.status(500).json({
                success: false,
                code: '500',
                message: 'Internal server error: Missing JWT_SECRET',
            });
        }

        try {
            const decoded = jwt.verify(token, secret) as { email: string };
            const user = await this.userRepository.findOne({
                where: { email: decoded.email }
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    code: '401',
                    message: 'Unauthorized.',
                });
            }

            req['user'] = user;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                code: '401',
                message: 'Unauthorized.',
            });
        }
    }
}

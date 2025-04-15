import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { Session } from './entities/session.entity';
import { LoginHistory } from './entities/loginhistory.entity';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Session, LoginHistory]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1h' },
        }),
        MulterModule.registerAsync({
            useFactory: () => ({
                storage: diskStorage({
                    destination: './uploads/profile-pictures',
                    filename: (req, file, cb) => {
                        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                        cb(null, `profile-${uniqueSuffix}${extname(file.originalname)}`);
                    },
                }),
            }),
        }),
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService]
})
export class UsersModule {}

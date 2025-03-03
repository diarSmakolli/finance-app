import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ResponseUserDto } from '../users/dto/response-user.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthMiddleware } from './auth.middleware';
import { AuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Post('signup')
    @ApiResponse({
        status: 201,
        description: 'Successfully registered.',
        type: Object
    })
    async signUp(@Body() createUserDto: CreateUserDto): Promise<any> {
        const user = this.authService.signUp(createUserDto);
        return user;
    }

    @Post('signin')
    @ApiResponse({
        status: 200,
        description: 'Successfully logged in.',
        type: Object,
    })
    async signIn(
        @Body() body: { email: string, password: string },
        @Res() res: Response
    ): Promise<any> {
        const user = await this.authService.signIn(body.email, body.password, res);
        return res.json(user);
    }

    @Post('logout')
    @ApiResponse({
        status: 200,
        description: 'Successfully logged out.',
        type: Object,
    })
    @UseGuards(AuthGuard)
    async signOut(@Res() res: Response): Promise<any> {
        const user = this.authService.signOut(res);
        return res.json(user);
    }

}

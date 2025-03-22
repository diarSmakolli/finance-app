import { Controller, Post, Body, Res, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ResponseUserDto } from '../users/dto/response-user.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
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
        const user = await this.authService.signUp(createUserDto);
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
        @Res() res: Response,
        @Req() req: Request,
    ): Promise<any> {
        const user = await this.authService.signIn(body.email, body.password, res, req);
        return res.json(user);
    }

    @Get('self')
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved details',
        type: Object,
    })
    @UseGuards(AuthGuard)
    async getSelf(@Req() req: Request, @Res() res: Response): Promise<any> {
        return res.json({
            status: 'success',
            code: '200',
            message: 'User details retrieved successfully',
            data: {
                user: req['user']
            }
        });
    }

    @Post('forgot-password')
    @ApiResponse({
        status: 200,
        description: 'Password reset instructions sent if email exists.',
        type: Object,
    })
    async forgotPassword(@Body() body: { email: string }): Promise<any> {
        const forgotReq = await this.authService.forgotPassword(body.email);
        return forgotReq;
    }

    @Post('logout')
    @ApiResponse({
        status: 200,
        description: 'Successfully logged out.',
        type: Object,
    })
    @UseGuards(AuthGuard)
    async signOut(
        @Req() req: Request & { cookies: { [key: string]: string } },
        @Res() res: Response
    ): Promise<void> {
        const result = await this.authService.signOut(req, res);
        res.json(result);
    }

}

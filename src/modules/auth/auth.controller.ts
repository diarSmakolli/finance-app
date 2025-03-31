import { Controller, Post, Body, Res, UseGuards, Req, Get, Query } from '@nestjs/common';
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
        const userResponse = ResponseUserDto.fromEntity(req['user']);
        return res.json({
            status: 'success',
            code: '200',
            message: 'User details retrieved successfully',
            data: {
                user: userResponse
            }
        });
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

    @Post('reset-password')
    @ApiResponse({
        status: 200,
        description: 'Password reset successful.',
        type: Object,
    })
    async resetPassword(
        @Query('token') token: string,
        @Body() body: { password: string }
    ): Promise<any> {
        return await this.authService.resetPassword(token, body.password);
    }

    @Post('verify-email')
    @ApiResponse({
        status: 200,
        description: 'Email verification successful.',
        type: Object,
    })
    async verifyAccount(@Query('token') token: string): Promise<any> {
        return await this.authService.verifyAccount(token);
    }

    @Post('change-password')
    @UseGuards(AuthGuard)
    @ApiResponse({
        status: 200,
        description: 'Password changed successfully.',
        type: Object,
    })
    async changePassword(
        @Req() req: Request,
        @Body() body: { currentPassword: string, newPassword: string }
    ): Promise<any> {
        const userId = req['user'].id;
        return await this.authService.changePassword(
            userId,
            body.currentPassword,
            body.newPassword
        );
    }
}

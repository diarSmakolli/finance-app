import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ResponseUserDto } from '../users/dto/response-user.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) {}

    @Post('signup')
    @ApiResponse({
        status: 201,
        description: 'Successfully registered.',
        type: Object
    })
    async signUp(@Body() createUserDto: CreateUserDto): Promise<any> {
        const user =  this.authService.signUp(createUserDto);
        return user;
    }

}

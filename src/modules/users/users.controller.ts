import { Controller, Put, Body, UseGuards, Req, Res, Get, Param, Post, UploadedFile, BadRequestException, UseInterceptors, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePersonalDto } from './dto/update-personal.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ParseFilePipe, FileTypeValidator, MaxFileSizeValidator } from '@nestjs/common';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Put('personal')
    @UseGuards(AuthGuard)
    @ApiResponse({
        status: 200,
        description: 'Personal information updated successfully',
        type: Object
    })
    async updatePersonal(
        @Req() req: Request,
        @Body() updateDto: UpdatePersonalDto,
    ) {
        const userId = req['user'].id;
        const updatedUser = await this.usersService.updatePersonal(userId, updateDto);
        
        return {
            status: 'success',
            code: '200',
            message: 'Personal information updated successfully',
            data: {
                user: updatedUser
            }
        };
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    @ApiResponse({
        status: 200,
        description: 'User personal information retrieved successfully',
        type: Object
    })
    async getPersonalById(@Param('id') id: string) {
        const user = await this.usersService.getPersonalById(id);
        
        return {
            status: 'success',
            code: '200',
            message: 'User personal information retrieved successfully',
            data: {
                user
            }
        };
    }

    @Post('profile-picture')
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({
        status: 200,
        description: 'Profile picture uploaded successfully',
        type: Object
    })
    async uploadProfilePicture(
        @Req() req: Request,
        @UploadedFile(new ParseFilePipe({
            validators: [
                new FileTypeValidator({ fileType: '.(png|jpeg|jpg|gif)' }),
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
            ],
            errorHttpStatusCode: 400,
            exceptionFactory: (error) => new BadRequestException(error)
        })) file: Express.Multer.File
    ) {
        try {
            if (!file) {
                throw new BadRequestException('No file uploaded');
            }

            const userId = req['user'].id;
            const updatedUser = await this.usersService.uploadProfilePicture(userId, file);
            
            return {
                status: 'success',
                code: '200',
                message: 'Profile picture uploaded successfully',
                data: {
                    user: updatedUser
                }
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(error.message);
        }
    }

    @Get(':id/profile-picture')
    @ApiResponse({
        status: 200,
        description: 'Profile picture retrieved successfully'
    })
    async getProfilePicture(
        @Param('id') id: string,
        @Res() res: Response
    ) {
        const file = await this.usersService.getProfilePicture(id);
        file.pipe(res);
    }

    @Get('/:id/sessions/active')
    @UseGuards(AuthGuard)
    @ApiResponse({
        status: 200,
        description: 'Active sessions retrieved successfully',
        type: Object
    })
    async getActiveSessions(
      @Param('id') id: string,
    ) {
        return await this.usersService.getActiveSessions(id);
    }

    @Delete('sessions/:sessionId')
    @UseGuards(AuthGuard)
    @ApiResponse({
        status: 200,
        description: 'Session terminated successfully',
        type: Object
    })
    async terminateSession(
        @Req() req: Request,
        @Param('sessionId') sessionId: string
    ) {
        const userId = req['user'].id;
        return await this.usersService.terminateSession(userId, sessionId);
    }
}

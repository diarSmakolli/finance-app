import { Injectable, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  // async create(createUserDto: CreateUserDto): Promise<ResponseUserDto> {
  //   try {
  //     const existingUser = await this.usersRepository.findOne({ where: { email: createUserDto?.email } });

  //     if (existingUser) {
  //       throw new ConflictException('Accont with this email exist in our records.');
  //     }

  //     const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

  //     const user = this.usersRepository.create({
  //       ...createUserDto,
  //       password: hashedPassword,
  //       isSuspicious: false,
  //       isActive: true,
  //       isBlocked: false,
  //       role: 'client',
  //     });

  //     const savedUser = await this.usersRepository.save(user);
      
  //     return ResponseUserDto.fromEntity(savedUser);
  //   } catch (error) {
  //     throw new InternalServerErrorException();
  //   }
  // }


}

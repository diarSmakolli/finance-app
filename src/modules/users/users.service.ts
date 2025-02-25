import { Injectable, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.usersRepository.findOne({ where: { email: createUserDto?.email } });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const user = this.usersRepository.create(createUserDto);
      
      return await this.usersRepository.save(user);
    } catch (error) {
        throw new InternalServerErrorException();
    }
  }

}

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '~/src/models/user.model';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly model: Model<User>) {}

  // WARNING: this method returns the hashed password too. It is ONLY to be used in the auth module.
  async getUser(username: string) {
    try {
      const user: UserDocument = await this.model.findOne({ username }).exec();
      return {
        id: user._id,
        name: user.name,
        username: user.username,
        password: user.password,
      };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  // WARNING: this expects that the password is ALREADY encrypted!
  async createUser(createUserDto: CreateUserDto) {
    try {
      const user: UserDocument = await this.model.findOne({ username: createUserDto.username }).exec();

      if (user) {
        throw new BadRequestException(`User with username ${createUserDto.username} already exists`);
      }

      const newUser = new this.model(createUserDto);
      await newUser.save();
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}

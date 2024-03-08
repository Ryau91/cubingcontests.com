import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { addWeeks } from 'date-fns';
import { IJwtPayload } from '~/src/helpers/interfaces/JwtPayload';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '@m/email/email.service';
import { UsersService } from '@m/users/users.service';
import { CreateUserDto } from '@m/users/dto/create-user.dto';
import { ContestState, Role } from '@sh/enums';
import { IPartialUser } from '~/src/helpers/interfaces/User';
import { ContestDocument } from '~/src/models/contest.model';
import { AuthTokenDocument } from '~/src/models/auth-token.model';
import { NO_ACCESS_RIGHTS_MSG } from '~/src/helpers/messages';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
    private jwtService: JwtService,
    @InjectModel('AuthToken') private readonly authTokenModel: Model<AuthTokenDocument>,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      // 10 is the number  of salt rounds
      createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    } catch (err) {
      throw new InternalServerErrorException(`Error while creating password hash: ${err.message}`);
    }

    // Give the user the user role by default
    await this.usersService.createUser({ ...createUserDto, roles: [Role.User] });
  }

  // The user comes from the passport local auth guard (local strategy), which uses the validateUser
  // method below; the user is then saved in the request and passed in from the controller
  async login(user: any) {
    const payload: IJwtPayload = {
      sub: user._id,
      personId: user.persondId,
      username: user.username,
      roles: user.roles,
    };

    try {
      return {
        accessToken: this.jwtService.sign(payload),
      };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async validateUser(username: string, password: string): Promise<IPartialUser> {
    const user = await this.usersService.getUserWithQuery({ username }, { includeHash: true });

    if (user) {
      const passwordsMatch = await bcrypt.compare(password, user.password);

      if (passwordsMatch) {
        return {
          _id: user._id,
          personId: user.personId,
          username: user.username,
          roles: user.roles,
        };
      }
    }

    throw new NotFoundException('The username or password is incorrect');
  }

  async revalidate(jwtUser: any) {
    const user: IPartialUser = await this.usersService.getUserWithQuery({ _id: jwtUser._id });

    const payload: IJwtPayload = {
      sub: user._id as string,
      personId: user.personId,
      username: user.username,
      roles: user.roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getUserRoles(id: string): Promise<Role[]> {
    return await this.usersService.getUserRoles(id);
  }

  // Assumes the user's access rights have already been checked
  async createAuthToken(competitionId: string): Promise<string> {
    const token = uuidv4();
    const hash = await bcrypt.hash(token, 0); // there's no need to salt the tokens

    try {
      // Delete existing valid auth token
      await this.authTokenModel.deleteOne({ competitionId, createdAt: { $gt: addWeeks(new Date(), -1) } }).exec();
      await this.authTokenModel.create({ token: hash, competitionId });
    } catch (err) {
      throw new InternalServerErrorException(`Error while saving token: ${err.message}`);
    }

    return token;
  }

  async validateAuthToken(token: string, competitionId: string): Promise<boolean> {
    let authToken: AuthTokenDocument;

    try {
      authToken = await this.authTokenModel
        .findOne({ competitionId, createdAt: { $gt: addWeeks(new Date(), -1) } })
        .exec();
    } catch (err) {
      throw new InternalServerErrorException(`Error while validating token: ${err.message}`);
    }

    return authToken && (await bcrypt.compare(token, authToken.token));
  }

  checkAccessRightsToContest(
    user: IPartialUser,
    contest: ContestDocument, // this must be populated
    { ignoreState = false }: { ignoreState: boolean } = { ignoreState: false },
  ) {
    if (
      !user.roles.includes(Role.Admin) &&
      (!user.roles.includes(Role.Moderator) ||
        !contest.organizers.some((el) => el.personId === user.personId) ||
        (contest.state >= ContestState.Finished && !ignoreState))
    ) {
      console.log(`User ${user.username} denied access rights to contest ${contest.competitionId}`);
      throw new UnauthorizedException(NO_ACCESS_RIGHTS_MSG);
    }
  }
}

import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly entityManager: EntityManager,
    private readonly jwtService: JwtService,
  ) {}

  ///////////////////  User Registration //////////////////////////

  async register(registerUserDto: RegisterUserDto) {
    try {
      this.logger.debug('register user');
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        //profileImage,
        address,
        dateOfBirth,
      } = registerUserDto;

      // hash password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Check existing user
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }

      // create new user
      const newUser = this.userRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,

        //profileImage,
        address,
        dateOfBirth,
      });

      await this.userRepository.save(newUser);

      return newUser;
    } catch (error) {
      this.logger.error(`register ${error}`);

      // conflict errors
      if (error instanceof ConflictException) {
        throw error;
      }
      // catch errors
      throw new UnauthorizedException('Failed to register new user');
    }
  }

  ////// Login User ////////
  async loginUser(loginUserDto: LoginUserDto) {
    try {
      this.logger.debug('login user');
      const { email, password } = loginUserDto;

      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (!existingUser) {
        throw new ConflictException('User not found');
      }

      // check password

      const isValidPassword = await bcrypt.compare(
        password,
        existingUser.password,
      );

      if (!isValidPassword) {
        throw new ConflictException('Invalid password');
      }

      // JWT payload
      const payload = {
        userId: existingUser.userId,
        email: existingUser.email,
      };

      // Create JWT token
      const token = this.jwtService.sign(payload, { expiresIn: '24h' });

      return { user: payload, token };
    } catch (error) {
      this.logger.error(`login ${error}`);
      // conflict errors
      if (error instanceof ConflictException) {
        throw error;
      }
      // catch errors
      throw new UnauthorizedException('Failed to login');
    }
  }
}

@Injectable()
export class JWTAuthService {
  constructor(
    private configService: ConfigService,
    private readonly jwtServ: JwtService,
  ) {}

  validateToken(token: string) {
    return this.jwtServ.verify(token, {
      secret: this.configService.get('app.jwtSecret'),
    });
  }
}
function loginUSer() {
  throw new Error('Function not implemented.');
}

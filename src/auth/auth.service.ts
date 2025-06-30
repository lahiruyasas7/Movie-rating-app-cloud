import {
  ConflictException,
  Injectable,
  Logger,
  Res,
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
import { Response } from 'express';

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
  /**
   * Login user and return access token and refresh token
   * @param loginUserDto
   * @param res
   */
  async loginUser(
    loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { email, password } = loginUserDto;

      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (!existingUser) throw new ConflictException('User not found');

      const isValidPassword = await bcrypt.compare(
        password,
        existingUser.password,
      );
      if (!isValidPassword) throw new ConflictException('Invalid password');

      const payload = {
        userId: existingUser.userId,
        email: existingUser.email,
      };

      const tokens = this.generateTokens(payload);

      // Send refreshToken in secure HttpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return { accessToken: tokens.accessToken, user: payload };
    } catch (error) {
      throw error instanceof ConflictException
        ? error
        : new UnauthorizedException('Failed to login');
    }
  }

  generateTokens(payload: any) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}

// auth.service.ts
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

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { Request, Response } from 'express';
import { UpdateUserDto } from './dto/update-user-details.dto';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly entityManager: EntityManager,
    private readonly jwtService: JwtService,
  ) {}

  private getRefreshCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      secure: isProd, // true in production with HTTPS and false in local with http
      sameSite: isProd ? 'none' : 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
    } as const;
  }

  ///////////////////  User Registration //////////////////////////

  async register(registerUserDto: RegisterUserDto, profileImageUrl?: string) {
    try {
      this.logger.debug('register user');
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
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
        profileImageUrl: profileImageUrl || null,
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
      res.cookie(
        'refreshToken',
        tokens.refreshToken,
        this.getRefreshCookieOptions(),
      );

      return { accessToken: tokens.accessToken, user: payload };
    } catch (error) {
      throw error instanceof ConflictException
        ? error
        : new UnauthorizedException('Failed to login');
    }
  }

  ///////// Update User Details /////////////
  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    newImageUrl?: string,
  ) {
    try {
      const user = await this.userRepository.findOne({ where: { userId } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Block email and profileImageUrl updates for Google users
      const isGoogleUser = !!user.googleId;

      if (isGoogleUser) {
        if (updateUserDto.email) {
          throw new ConflictException(
            'Cannot update email for Google-authenticated users',
          );
        }
        if (newImageUrl) {
          throw new ConflictException(
            'Cannot update profile image for Google-authenticated users',
          );
        }
      }

      // Merge fields
      Object.assign(user, updateUserDto);

      if (!isGoogleUser && newImageUrl) {
        user.profileImageUrl = newImageUrl;
      }

      return await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(`update user ${userId} ${error}`);
      throw new UnauthorizedException('Failed to update user details');
    }
  }

  /////////refresh token //////////
  async refreshTokens(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const newTokens = this.generateTokens({
        userId: payload.userId,
        email: payload.email,
      });

      // Set new refresh token in HttpOnly cookie
      res.cookie(
        'refreshToken',
        newTokens.refreshToken,
        this.getRefreshCookieOptions(),
      );

      return { accessToken: newTokens.accessToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async loginWithGoogle(googleProfile: any, res: Response) {
    const { email, name, picture, googleId } = googleProfile;

    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      const [firstName, ...rest] = name.split(' ');
      const lastName = rest.join(' ');

      user = this.userRepository.create({
        email,
        firstName,
        lastName,
        profileImageUrl: picture,
        googleId,
        provider: 'google',
      });

      await this.userRepository.save(user);
    }

    // Now issue tokens as usual
    const payload = {
      userId: user.userId,
      email: user.email,
    };

    const tokens = this.generateTokens(payload);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: tokens.accessToken,
      user: payload,
    };
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

  //get user details
  async getUserById(id: string) {
    const userData = await this.userRepository.findOne({
      where: { userId: id },
    });

    return {
      userId: userData.userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      profileImageUrl: userData.profileImageUrl,
      address: userData.address,
      dateOfBirth: userData.dateOfBirth,
      googleId: userData.googleId,
    };
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

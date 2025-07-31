import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  Req,
  NotFoundException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from './auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multerS3 from 'multer-s3';
import { S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { UploadService } from 'src/util/uploadTos3.service';
import { UpdateUserDto } from './dto/update-user-details.dto';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Auth') // swagger tag
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly uploadService: UploadService,
  ) {}

  ////////// register ///////////
  @ApiOperation({ summary: 'Register a new User' }) // Operation summary swagger
  @ApiResponse({ status: 201, description: '' }) // api response swagger
  @ApiResponse({ status: 409, description: 'Email is already in use' }) // api response swagger
  @ApiBody({
    description: 'Register with profile image',
    required: true,
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user6@gmail.com' },
        password: { type: 'string', example: 'Gh@1hjjj78' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        phone: { type: 'string', example: '0771234567' },
        address: { type: 'string', example: 'Colombo' },
        dateOfBirth: { type: 'string', example: '1995-01-01' },
        profileImage: {
          type: 'string',
          format: 'binary',
          description: 'Profile image file',
        },
      },
    },
  })
  @SkipThrottle()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profileImage'))
  @Post('register')
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @UploadedFile() file: any,
  ) {
    const imageUrl = await this.uploadService.uploadProfileImage(file);
    return this.authService.register(registerUserDto, imageUrl);
  }

  ///////// login /////////////
  @SkipThrottle()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'login a user' })
  @ApiResponse({ status: 409, description: 'Invalid password' })
  @ApiBody({ type: LoginUserDto })
  async login(
    @Body() loginDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.loginUser(loginDto, res);
  }

  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update user data (optional image upload)',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'newemail@gmail.com' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' },
        dateOfBirth: { type: 'string' },
        profileImage: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @Patch('update/:userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = file
      ? await this.uploadService.uploadProfileImage(file)
      : undefined;

    return this.authService.updateUser(userId, updateUserDto, imageUrl);
  }

  ////refresh token //////////
  @SkipThrottle()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshTokens(req, res);
  }

  @Get('google')
  @UseGuards(PassportAuthGuard('google'))
  googleAuth() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const { accessToken, user } = await this.authService.loginWithGoogle(
      req.user,
      res,
    );

    const queryParams = new URLSearchParams({
      accessToken,
      user: JSON.stringify(user),
    }).toString();

    // redirect to frontend with token in query
    res.redirect(`http://localhost:5173/google-success?${queryParams}`);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get All User Details for logged user',
  })
  @SkipThrottle()
  @Get(':id')
  @UseGuards(AuthGuard)
  async getUserById(@Param('id') id: string) {
    const user = await this.authService.getUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}

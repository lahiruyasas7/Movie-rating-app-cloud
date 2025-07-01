import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import {
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

@ApiTags('Auth') // swagger tag
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  ////////// register ///////////
  @ApiOperation({ summary: 'Register a new User' }) // Operation summary swagger
  @ApiResponse({ status: 201, description: '' }) // api response swagger
  @ApiResponse({ status: 409, description: 'Email is already in use' }) // api response swagger
  //@ApiConsumes('form-data')
  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  ///////// login /////////////
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

  ////refresh token //////////

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshTokens(req, res);
  }
}

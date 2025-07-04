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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from './auth.guard';

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

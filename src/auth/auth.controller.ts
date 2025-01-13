import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto';

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
}

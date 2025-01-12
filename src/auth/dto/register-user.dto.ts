import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    type: 'string',
    description: 'register the user email',
    required: true,
    example: 'user6@gmail.com',
  })
  @IsNotEmpty({ message: 'email can not be empty' })
  @IsEmail()
  email: string;

  @ApiProperty({
    type: 'string',
    description: 'register the user password',
    required: true,
    example: 'Gh@1hjjj78',
  })
  @IsNotEmpty({ message: 'password can not be empty' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dateOfBirth: string;
}

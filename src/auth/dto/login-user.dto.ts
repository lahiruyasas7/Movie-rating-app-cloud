import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsStrongPassword } from 'class-validator';

export class LoginUserDto {
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
}
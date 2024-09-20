import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    ForbiddenException,
  } from '@nestjs/common';
  
  import { JWTAuthService } from './auth.service';
  
  @Injectable()
  export class AuthGuard implements CanActivate {
    constructor(private readonly jwtauthService: JWTAuthService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      try {
        const request = context.switchToHttp().getRequest();
        const { authorization }: any = request.headers;
        if (!authorization || authorization.trim() === '') {
          throw new UnauthorizedException('Please provide token');
        }
        const authToken = authorization.replace(/bearer/gim, '').trim();
        const resp = await this.jwtauthService.validateToken(authToken);
        request.decodedData = resp;
        return true;
      } catch (error) {
        console.log('auth error - ', error.message);
        throw new ForbiddenException(
          error.message || 'session expired! Please sign In',
        );
      }
    }
  }
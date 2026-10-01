import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwksService } from '../../jwks/jwks.service.js';
import { UserPojo } from '@common/interfaces/user.interface.js';
import { UserContext } from '@common/context/user-context.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwksService: JwksService) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authHeader.split(' ')[1];
    try {
      const userPayload = await this.jwksService.verifyToken(token) as unknown as UserPojo;
      request.user = userPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid Token');
    }
    return true;
  }
}

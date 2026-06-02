import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class BackofficeGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const secret = req.headers['x-backoffice-secret'];
    if (!secret || secret !== process.env.BACKOFFICE_SECRET) {
      throw new UnauthorizedException('Invalid or missing backoffice secret');
    }
    return true;
  }
}

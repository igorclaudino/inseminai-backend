import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const FarmId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest().farmId;
});

export const MemberRole = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest().memberRole;
});

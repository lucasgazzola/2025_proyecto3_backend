import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Payload } from '../common/interfaces/payload';

export const CurrentUser = createParamDecorator(
  (
    data: keyof Payload | undefined,
    ctx: ExecutionContext,
  ): Payload | Payload[keyof Payload] | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as Payload | undefined;
    if (!data) return user;
    return user?.[data];
  },
);

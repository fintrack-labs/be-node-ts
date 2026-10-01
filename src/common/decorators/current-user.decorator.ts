import { UserPojo } from '@common/interfaces/user.interface.js';
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
    (data: keyof UserPojo | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as UserPojo;
        if (!user) throw new UnauthorizedException("User not found");
        return data ? user[data] : user;
    },
);
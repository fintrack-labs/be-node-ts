import { FastifyRequest, FastifyReply, DoneFuncWithErrOrRes } from 'fastify';
import { UserContext } from '../context/user-context.js';
import { UserPojo } from '../interfaces/user.interface.js';

export function fastifyUserContextHook(
    req: FastifyRequest,
    reply: FastifyReply,
    done: DoneFuncWithErrOrRes,
) {
    const user = (req as any).user as UserPojo;
    if (user) {
        UserContext.run(user, () => done());
    } else {
        done();
    }
}
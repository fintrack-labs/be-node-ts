import { UserPojo } from '../common/interfaces/user.interface';
import 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        user?: UserPojo;
    }
}
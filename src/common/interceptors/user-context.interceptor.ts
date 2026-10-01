import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserContext } from '../context/user-context.js';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return next.handle();
        }
        return new Observable((observer) => {
            UserContext.run(user, () => {
                const subscription = next.handle().subscribe({
                    next: (value) => observer.next(value),
                    error: (err) => observer.error(err),
                    complete: () => observer.complete(),
                });
                return () => subscription.unsubscribe();
            });
        })
    }
}
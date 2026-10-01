import { AsyncLocalStorage } from "async_hooks";
import { UserPojo } from "@common/interfaces/user.interface.js";

export class UserContext {
    private static readonly storage = new AsyncLocalStorage<UserPojo>();

    static run<T>(user: UserPojo, callback: () => T): T {
        return this.storage.run(user, callback);
    }

    static setUser(user: UserPojo) {
        return this.storage.run(user, () => { });
    }

    static getUser(): UserPojo | undefined {
        return this.storage.getStore();
    }

    static getUserId(): string | undefined {
        const user = this.getUser();
        return user?.userId;
    }

}
import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from "typeorm";
import { AuditEntity } from "../entities/audit.entity.js";
import { UserContext } from "@common/context/user-context.js";

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface<AuditEntity> {
    listenTo() {
        return AuditEntity;
    }

    beforeInsert(event: InsertEvent<AuditEntity>) {
        if (!event.entity) return;
        const userId = UserContext.getUserId();
        if (event.entity && userId) {
            event.entity.createdBy = userId;
        }
    }

    beforeUpdate(event: UpdateEvent<AuditEntity>) {
        if (!event.entity) return;
        const userId = UserContext.getUserId();
        if (event.entity && userId) {
            event.entity.updatedBy = userId;
        }
    }
}
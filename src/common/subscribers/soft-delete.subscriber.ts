import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, SoftRemoveEvent } from "typeorm";
import { SoftDeleteEntity } from "../entities/soft-delete.entity.js";
import { UserContext } from "@common/context/user-context.js";

@EventSubscriber()
export class SoftDeleteSubscriber implements EntitySubscriberInterface<SoftDeleteEntity> {
    listenTo() {
        return SoftDeleteEntity;
    }

    async beforeSoftRemove(event: SoftRemoveEvent<SoftDeleteEntity>) {
        if (!event.entity) return;
        const userId = UserContext.getUserId();
        if (event.entity && userId) {
            event.entity.deletedBy = userId;
            const metadata = event.metadata;
            const tableName = metadata.tableName;
            const primaryColumns = metadata.primaryColumns;

            if (primaryColumns.length > 0) {
                const pkName = primaryColumns[0].databaseName;
                const pkValue = (event.entity as any)[primaryColumns[0].propertyName];

                // update manual deletedBy, make it double query update
                await event.queryRunner.manager
                    .createQueryBuilder()
                    .update(metadata.target)
                    .set({ deletedBy: userId })
                    .where(`${pkName} = :id`, { id: pkValue })
                    .execute();
            }
        }
    }

    beforeUpdate(event: UpdateEvent<SoftDeleteEntity>) {
        const userId = UserContext.getUserId();
        if (!userId) return;

        if (event.entity) {
            if (event.entity.deletedAt) {
                event.entity.deletedBy = userId;
            }
        }
    }
}
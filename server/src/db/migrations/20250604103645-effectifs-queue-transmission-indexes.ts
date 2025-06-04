import { effectifsQueueDb } from "@/common/model/collections";

export const up = async () => {
  const collection = effectifsQueueDb();

  await collection.createIndex(
    {
      processed_at: -1,
    },
    {
      name: "processed_at_-1_for_admin_transmissions",
      background: true,
    }
  );

  await collection.createIndex(
    {
      processed_at: -1,
      validation_errors: 1,
      error: 1,
    },
    {
      name: "processed_at_-1_validation_errors_1_error_1",
      background: true,
    }
  );
};

export const down = async () => {
  const collection = effectifsQueueDb();

  await collection.dropIndex("processed_at_-1_validation_errors_1_error_1");
  await collection.dropIndex("processed_at_-1_for_admin_transmissions");
};

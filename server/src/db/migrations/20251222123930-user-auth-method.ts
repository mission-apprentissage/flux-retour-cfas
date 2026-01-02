import { usersMigrationDb } from "@/common/model/collections";

export const up = async () => {
  await usersMigrationDb().updateMany({}, { $set: { auth_method: "password" } });
};

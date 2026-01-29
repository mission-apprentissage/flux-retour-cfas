import { ObjectId, WithoutId } from "mongodb";
import { IMaintenanceMessage } from "shared/models/data/maintenanceMessages.model";

import { maintenanceMessageDb } from "@/common/model/collections";
import { defaultValuesMaintenanceMessage } from "@/common/model/maintenanceMessages.model";

/**
 * Méthode de création d'un message de maintenance
 */
export const createMaintenanceMessage = async ({
  name,
  msg,
  type,
  context,
  time,
  enabled,
}: WithoutId<IMaintenanceMessage>): Promise<IMaintenanceMessage> => {
  const data = {
    _id: new ObjectId(),
    ...defaultValuesMaintenanceMessage(),
    type,
    name,
    context,
    msg,
    enabled: enabled || false,
    time: time,
  };
  await maintenanceMessageDb().insertOne(data);
  return data;
};

/**
 * Méthode de mise à jour d'un message de maintenance depuis son id
 */
export const updateMaintenanceMessage = async (_id: string | ObjectId, data: Partial<IMaintenanceMessage>) => {
  const item = await maintenanceMessageDb().findOne({ _id: new ObjectId(_id) });

  if (!item) {
    throw new Error("Unable to find maintenance message");
  }

  const updated = await maintenanceMessageDb().findOneAndUpdate(
    { _id: item._id },
    {
      $set: data,
    },
    { returnDocument: "after", includeResultMetadata: true }
  );

  return updated.value;
};

/**
 * Méthode de récupération de la liste des messages de maintenance en base
 *
 * @returns
 */
export const findMaintenanceMessages = async () => {
  return await maintenanceMessageDb().find({}).toArray();
};

/**
 * Méthode de suppression d'un message de maintenance depuis son id
 */
export const removeMaintenanceMessage = async (_id: string | ObjectId) => {
  const item = await maintenanceMessageDb().findOne({ _id: new ObjectId(_id) });

  if (!item) {
    throw new Error("Unable to find maintenance message");
  }

  return await maintenanceMessageDb().deleteOne({ _id: item._id });
};

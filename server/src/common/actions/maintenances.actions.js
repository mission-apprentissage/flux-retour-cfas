import { ObjectId } from "mongodb";

import { maintenanceMessageDb } from "../model/collections.js";
import { defaultValuesMaintenanceMessage } from "../model/next.toKeep.models/maintenanceMessages.model.js";

/**
 * Méthode de création d'un message de maintenance
 *
 * @param {*} param0
 * @returns
 */
export const createMaintenanceMessage = async ({ name, msg, type, context, time, enabled }) => {
  const data = {
    ...defaultValuesMaintenanceMessage(),
    type,
    name,
    context,
    msg,
    enabled: enabled || false,
    time: time,
  };
  const { insertedId } = await maintenanceMessageDb().insertOne(data);
  return { _id: insertedId, ...data };
};

/**
 * Méthode de mise à jour d'un message de maintenance depuis son id
 * @param {*} _id
 * @returns
 */
export const updateMaintenanceMessage = async (_id, data) => {
  const item = await maintenanceMessageDb().findOne({ _id: ObjectId(_id) });

  if (!item) {
    throw new Error("Unable to find maintenance message");
  }

  const updated = await maintenanceMessageDb().findOneAndUpdate(
    { _id: item._id },
    {
      $set: data,
    },
    { returnDocument: "after" }
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
 * @param {*} _id
 * @returns
 */
export const removeMaintenanceMessage = async (_id) => {
  const item = await maintenanceMessageDb().findOne({ _id: ObjectId(_id) });

  if (!item) {
    throw new Error("Unable to find maintenance message");
  }

  return await maintenanceMessageDb().deleteOne({ _id: item._id });
};

import Boom from "boom";
import { ObjectId } from "mongodb";

import { erpDb } from "../model/collections";

export const createERP = async (name: string) => {
  return erpDb().insertOne({ _id: new ObjectId(), name, created_at: new Date() });
};

export const deleteERPById = async (id: string) => {
  const erp = await erpDb().findOne({ _id: new ObjectId(id) });

  if (!erp) {
    throw Boom.notFound(`ERP with id ${id} not found`);
  }

  return erpDb().deleteOne({ _id: new ObjectId(id) });
};

export const findAllERP = async () => {
  return await erpDb().find().toArray();
};

import Boom from "boom";
import { ObjectId } from "mongodb";

import { erpDb } from "../model/collections";
import { slugify } from "../utils/stringUtils";

export const createERP = async (name: string, helpFilePath = null) => {
  const uniqueId = slugify(name);

  return erpDb().insertOne({
    _id: new ObjectId(),
    name,
    created_at: new Date(),
    apiV3: true,
    unique_id: uniqueId,
    helpFilePath,
  });
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

import { BaseIndexer } from "./baseIndexer.js";
import cfasModelDescriptor from "../previous.models/cfas.model.js";
import dossiersApprenantsModelDescriptor from "../previous.models/dossiersApprenants.model.js";
import formationsModelDescriptor from "../previous.models/formations.model.js";
import reseauxCfasModelDescriptor from "../previous.models/reseauxCfas.model.js";
import userEventsModelDescriptor from "../previous.models/userEvents.model.js";
import usersModelDescriptor from "../previous.models/users.model.js";

// TODO ADD INDEXES NEW MODEL

export const createIndexes = async () => {
  await new BaseIndexer({
    collectionName: cfasModelDescriptor.collectionName,
    indexesList: cfasModelDescriptor.indexes,
  }).createIndexs();

  await new BaseIndexer({
    collectionName: dossiersApprenantsModelDescriptor.collectionName,
    indexesList: dossiersApprenantsModelDescriptor.indexes,
  }).createIndexs();

  await new BaseIndexer({
    collectionName: formationsModelDescriptor.collectionName,
    indexesList: formationsModelDescriptor.indexes,
  }).createIndexs();

  await new BaseIndexer({
    collectionName: reseauxCfasModelDescriptor.collectionName,
    indexesList: reseauxCfasModelDescriptor.indexes,
  }).createIndexs();

  await new BaseIndexer({
    collectionName: userEventsModelDescriptor.collectionName,
    indexesList: userEventsModelDescriptor.indexes,
  }).createIndexs();

  await new BaseIndexer({
    collectionName: usersModelDescriptor.collectionName,
    indexesList: usersModelDescriptor.indexes,
  }).createIndexs();
};

export const dropIndexes = async () => {
  await new BaseIndexer({
    collectionName: cfasModelDescriptor.collectionName,
    indexesList: cfasModelDescriptor.indexes,
  }).dropIndexs();

  await new BaseIndexer({
    collectionName: dossiersApprenantsModelDescriptor.collectionName,
    indexesList: dossiersApprenantsModelDescriptor.indexes,
  }).dropIndexs();

  await new BaseIndexer({
    collectionName: formationsModelDescriptor.collectionName,
    indexesList: formationsModelDescriptor.indexes,
  }).dropIndexs();

  await new BaseIndexer({
    collectionName: reseauxCfasModelDescriptor.collectionName,
    indexesList: reseauxCfasModelDescriptor.indexes,
  }).dropIndexs();

  await new BaseIndexer({
    collectionName: userEventsModelDescriptor.collectionName,
    indexesList: userEventsModelDescriptor.indexes,
  }).dropIndexs();

  await new BaseIndexer({
    collectionName: usersModelDescriptor.collectionName,
    indexesList: usersModelDescriptor.indexes,
  }).dropIndexs();
};

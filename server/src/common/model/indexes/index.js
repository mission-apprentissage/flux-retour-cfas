import { BaseIndexer } from "./baseIndexer.js";
import cfasModelDescriptor from "./../cfas.model.js";
import dossiersApprenantsModelDescriptor from "../dossiersApprenants.model.js";
import formationsModelDescriptor from "../formations.model.js";
import reseauxCfasModelDescriptor from "../reseauxCfas.model.js";
import userEventsModelDescriptor from "../userEvents.model.js";
import usersModelDescriptor from "../users.model.js";

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

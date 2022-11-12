import { BaseIndexer } from "./baseIndexer";
import cfasModelDescriptor from "./../cfas.model";
import dossiersApprenantsModelDescriptor from "../dossiersApprenants.model";
import formationsModelDescriptor from "../formations.model";
import reseauxCfasModelDescriptor from "../reseauxCfas.model";
import userEventsModelDescriptor from "../userEvents.model";
import usersModelDescriptor from "../users.model";

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

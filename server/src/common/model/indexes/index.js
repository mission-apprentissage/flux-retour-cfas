const { BaseIndexer } = require("./baseIndexer");
const cfasModelDescriptor = require("./../cfas.model");
const dossiersApprenantsModelDescriptor = require("../dossiersApprenants.model");
const formationsModelDescriptor = require("../formations.model");
const reseauxCfasModelDescriptor = require("../reseauxCfas.model");
const userEventsModelDescriptor = require("../userEvents.model");
const usersModelDescriptor = require("../users.model");

const createIndexes = async () => {
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

const dropIndexes = async () => {
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

module.exports = { createIndexes, dropIndexes };

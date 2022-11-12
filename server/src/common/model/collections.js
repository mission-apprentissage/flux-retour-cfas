import { getDbCollection } from "../mongodb";
import usersModelDescriptor from "./users.model";
import userEventsModelDescriptor from "./userEvents.model";
import cfasModelDescriptor from "./cfas.model";
import formationsModelDescriptor from "./formations.model";
import reseauxCfasModelDescriptor from "./reseauxCfas.model";
import dossiersApprenantsModelDescriptor from "./dossiersApprenants.model";
import jobEventsModelDescriptor from "./jobEvents.model";
import effectifsApprenantsModelDescriptor from "./effectifsApprenants.model";
import demandesIdentifiantsModelDescriptor from "./demandesIdentifiants.model";
import demandesBranchementErpDbModelDescriptor from "./demandesBranchementErp.model";
import duplicatesEventsModelDescriptor from "./duplicatesEvents.model";

export const dossiersApprenantsDb = () => {
  return getDbCollection(dossiersApprenantsModelDescriptor.collectionName);
};

export const cfasDb = () => {
  return getDbCollection(cfasModelDescriptor.collectionName);
};

export const reseauxCfasDb = () => {
  return getDbCollection(reseauxCfasModelDescriptor.collectionName);
};

export const formationsDb = () => {
  return getDbCollection(formationsModelDescriptor.collectionName);
};

export const usersDb = () => {
  return getDbCollection(usersModelDescriptor.collectionName);
};

export const userEventsDb = () => {
  return getDbCollection(userEventsModelDescriptor.collectionName);
};

export const jobEventsDb = () => {
  return getDbCollection(jobEventsModelDescriptor.collectionName);
};

export const effectifsApprenantsDb = () => {
  return getDbCollection(effectifsApprenantsModelDescriptor.collectionName);
};

export const demandesIdentifiantsDb = () => {
  return getDbCollection(demandesIdentifiantsModelDescriptor.collectionName);
};

export const demandesBranchementErpDb = () => {
  return getDbCollection(demandesBranchementErpDbModelDescriptor.collectionName);
};

export const duplicatesEventsDb = () => {
  return getDbCollection(duplicatesEventsModelDescriptor.collectionName);
};

const { dossiersApprenantSifaProjection, mapToDonneeSifa } = require("../domain/donneeSifa.js");
const { DonneeSifaFactory } = require("../factory/donneeSifa.js");
const { DossierApprenantModel, DonneesSifaModel } = require("../model");
const { asyncForEach } = require("../utils/asyncUtils.js");

/**
 * Création des données SIFA pour un OF via son UAI
 * ->  Comportement
 * On ne gère que la création des dossiersApprenants non déja présents dans les donnéesSifa
 * Concrètement si un nouveau dossierApprenant est ajouté, il sera ajouté aux donnéesSifa
 * Si un dossierApprenant est mis à jour, on ne fait rien, il risque d'y avoir conflit entre les modifications faites coté ERP
 * et les modifications faites via l'interface du TdB.
 
 * @param {*} uai
 * @returns
 */
const createDonneesSifaForOf = async (uai) => {
  const dossiersApprenantsNotInDonneesSifa = await getSifaFieldsFromDossiersApprenantsNotInDonneesSifa(uai);

  // Pour chaque dossierApprenant non déja présent
  await asyncForEach(dossiersApprenantsNotInDonneesSifa, async (dossierToAddToDonneesSifa) => {
    const donneeSifaFromDossierApprenant = mapToDonneeSifa(dossierToAddToDonneesSifa);
    const donneeSifaEntity = DonneeSifaFactory.create(donneeSifaFromDossierApprenant);
    await new DonneesSifaModel(donneeSifaEntity).save();
  });

  return null;
};

/**
 * Récupération des champs SIFA des dossiersApprenants non déja présents dans la collection DonnéesSifa
 * Pour chaque nouveau dossierApprenant on récupère une nouvelle donnée SIFA
 * Pour les dossiersApprenants ayant été mis à jour, ils ne sont pas remontés
 * @param {*} uai
 * @returns
 */
const getSifaFieldsFromDossiersApprenantsNotInDonneesSifa = async (uai) => {
  const dossiersApprenantsSifaFieldNotInDonneesSifa = await DossierApprenantModel.aggregate([
    { $match: { uai_etablissement: uai } },
    {
      $lookup: {
        from: "donneesSifa",
        localField: "_id",
        foreignField: "dossierApprenant_id",
        as: "match_dossiers_apprenants",
      },
    },
    { $match: { match_dossiers_apprenants: { $size: 0 } } },
    { $project: dossiersApprenantSifaProjection },
  ]);

  return dossiersApprenantsSifaFieldNotInDonneesSifa;
};

module.exports = () => ({ createDonneesSifaForOf, getSifaFieldsFromDossiersApprenantsNotInDonneesSifa });

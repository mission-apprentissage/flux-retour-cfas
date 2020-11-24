const formFieldToDsId = require("./constants").formFieldToDsId;

const mapDsChamps = async (dossier) => {
  if (dossier.champs) {
    return {
      questions: {
        erpNom: getValueFromChamp(dossier, formFieldToDsId.erpNom),
        erpNomAutre: getValueFromChamp(dossier, formFieldToDsId.erpNomAutre),
        cfaDirecteurNom: getValueFromChamp(dossier, formFieldToDsId.cfaDirecteurNom),
        cfaDirecteurPrenom: getValueFromChamp(dossier, formFieldToDsId.cfaDirecteurPrenom),
        cfaDirecteurEmail: getValueFromChamp(dossier, formFieldToDsId.cfaDirecteurEmail),
        cfaDirecteurNumTel1: getValueFromChamp(dossier, formFieldToDsId.cfaDirecteurNumTel1),
        cfaDirecteurNumTel2: getValueFromChamp(dossier, formFieldToDsId.cfaDirecteurNumTel2),
        responsableTechniqueNom: getValueFromChamp(dossier, formFieldToDsId.responsableTechniqueNom),
        responsableTechniquePrenom: getValueFromChamp(dossier, formFieldToDsId.responsableTechniquePrenom),
        responsableTechniqueEmail: getValueFromChamp(dossier, formFieldToDsId.responsableTechniqueEmail),
        responsableTechniqueNumeroTel1: getValueFromChamp(dossier, formFieldToDsId.responsableTechniqueNumeroTel1),
        responsableTechniqueNumeroTel2: getValueFromChamp(dossier, formFieldToDsId.responsableTechniqueNumeroTel2),
        prestaTechExternalisee: getValueFromChamp(dossier, formFieldToDsId.prestaTechExternalisee),
        prestaTechSiretEntreprise: getValueFromChamp(dossier, formFieldToDsId.prestaTechSiretEntreprise),
        prestaTechNom: getValueFromChamp(dossier, formFieldToDsId.prestaTechNom),
        prestaTechPrenom: getValueFromChamp(dossier, formFieldToDsId.prestaTechPrenom),
        prestaTechEmail: getValueFromChamp(dossier, formFieldToDsId.prestaTechEmail),
        prestaTechTel1: getValueFromChamp(dossier, formFieldToDsId.prestaTechTel1),
        prestaTechTel2: getValueFromChamp(dossier, formFieldToDsId.prestaTechTel2),
        coordonnesRespTechMultiSites: getValueFromChamp(dossier, formFieldToDsId.coordonnesRespTechMultiSites),
        commentairesMerci: getValueFromChamp(dossier, formFieldToDsId.commentairesMerci),
      },
    };
  }
};
module.exports.mapDsChamps = mapDsChamps;

const getValueFromChamp = (dossier, champId) => {
  const champFound = dossier.champs.find((item) => item.type_de_champ.id === champId);
  return champFound ? (champFound.value ? champFound.value.trim() : null) : null;
};

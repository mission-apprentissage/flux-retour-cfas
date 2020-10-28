const formFieldToDsId = {
  erpNom: 1410972,
  erpNomAutre: 1411119,
  cfaDirecteurNom: 1411591,
  cfaDirecteurPrenom: 1411592,
  cfaDirecteurEmail: 1411593,
  cfaDirecteurNumTel1: 1411594,
  cfaDirecteurNumTel2: 1411595,
  responsableTechniqueNom: 1411596,
  responsableTechniquePrenom: 1411598,
  responsableTechniqueEmail: 1411599,
  responsableTechniqueNumeroTel1: 1411600,
  responsableTechniqueNumeroTel2: 1411601,
  prestaTechExternalisee: 1411604,
  prestaTechSiretEntreprise: 1412241,
  prestaTechNom: 1411949,
  prestaTechPrenom: 1411951,
  prestaTechEmail: 1412237,
  prestaTechTel1: 1412239,
  prestaTechTel2: 1412240,
  coordonnesRespTechMultiSites: 1411602,
};

const erps = [
  {
    name: "Aucun",
    value: "Aucun ou Autre système de gestion",
  },
  {
    name: "Ymag",
    value: "Ymag - Yparéo",
    totalCfasKnown: 458,
  },
  {
    name: "AurigaAurion",
    value: "Auriga - Aurion",
  },
  {
    name: "Gesti",
    value: "Gestibase - IGesti et IMFR",
    totalCfasKnown: 481,
  },
  {
    name: "HyperPlanning",
    value: "HyperPlanning - Index Education",
  },
  {
    name: "Unit4",
    value: "Unit4 - Unit4 Student Management",
  },
  {
    name: "ValSoftware",
    value: "Val Software - Ammon",
  },
];

const dsStates = {
  recue: "received",
  initiee: "initiated",
};

module.exports = {
  formFieldToDsId,
  erps,
  dsStates,
};

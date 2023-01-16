export const ERP_STATE = {
  ready: "ready",
  ongoing: "ongoing",
  coming: "coming",
  otherErp: "otherErp",
  noErp: "noErp",
};

export const ERP_STATE_COLOR = {
  [ERP_STATE.ready]: "#417DC4",
  [ERP_STATE.ongoing]: "#C3992A",
  [ERP_STATE.coming]: "#BD987A",
};

export const ERPS = [
  {
    id: "GESTI",
    name: "Gesti",
    state: ERP_STATE.ready,
    helpFilePath: "https://files.tableau-de-bord.apprentissage.beta.gouv.fr/pas-a-pas/gesti.pdf",
    helpFileSize: "352kb",
  },
  {
    id: "YMAG",
    name: "Ymag",
    state: ERP_STATE.ready,
    helpFilePath: "https://files.tableau-de-bord.apprentissage.beta.gouv.fr/pas-a-pas/ypareo.pdf",
    helpFileSize: "1.7Mb",
  },
  {
    id: "SCFORM",
    name: "SC Form",
    state: ERP_STATE.ready,
    helpFilePath: "https://files.tableau-de-bord.apprentissage.beta.gouv.fr/pas-a-pas/scform.pdf",
    helpFileSize: "734Kb",
  },
  {
    id: "FORMASUP",
    name: "Formasup",
    state: ERP_STATE.ready,
  },
  {
    id: "FCAMANAGER",
    name: "FCA Manager",
    state: ERP_STATE.ready,
    helpFilePath: "https://files.tableau-de-bord.apprentissage.beta.gouv.fr/pas-a-pas/fcamanager.pdf",
    helpFileSize: "288Kb",
  },
  {
    id: "AURIGA",
    name: "Auriga",
    state: ERP_STATE.ready,
    helpFilePath: "https://wiki.auriga.fr/index.php?title=Connecteur_Tableau_de_bord_de_l%27apprentissage",
  },
  { id: "CNAM", name: "CNAM (Gessic@)", state: ERP_STATE.coming },
  { id: "ALCUINSOFTWARE", name: "Alcuin Software", state: ERP_STATE.coming },
  { id: "HYPERPLANNING", name: "Hyperplanning", state: ERP_STATE.coming },
  { id: "VALSOFTWARE", name: "Valsoftware", state: ERP_STATE.coming },
  { id: "AGATE", name: "Agate", state: ERP_STATE.coming },
];

export const ERPS_FORM_CASES = [
  ...ERPS,
  { name: "Autre ERP", state: ERP_STATE.otherErp },
  { name: "Je n'ai pas d'ERP", state: ERP_STATE.noErp },
];

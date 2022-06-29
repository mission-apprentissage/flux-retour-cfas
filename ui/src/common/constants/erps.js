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
    name: "Gesti",
    state: ERP_STATE.ready,
    helpFilePath: "https://files.tableau-de-bord.apprentissage.beta.gouv.fr/pas-a-pas/gesti.pdf",
  },
  {
    name: "Ymag",
    state: ERP_STATE.ready,
    helpFilePath: "https://files.tableau-de-bord.apprentissage.beta.gouv.fr/pas-a-pas/ypareo.pdf",
  },
  {
    name: "SC Form",
    state: ERP_STATE.ready,
    helpFilePath: "https://files.tableau-de-bord.apprentissage.beta.gouv.fr/pas-a-pas/scform.pdf",
  },
  {
    name: "Formasup",
    state: ERP_STATE.ready,
  },
  { name: "FCA Manager", state: ERP_STATE.ongoing },
  { name: "Auriga", state: ERP_STATE.ongoing },
  { name: "CNAM (Gessic@)", state: ERP_STATE.coming },
  { name: "SI2G", state: ERP_STATE.coming },
  { name: "Hyperplanning", state: ERP_STATE.coming },
  { name: "Valsoftware", state: ERP_STATE.coming },
  { name: "Agate", state: ERP_STATE.coming },
];

export const ERPS_FORM_CASES = [
  ...ERPS,
  { name: "Autre ERP", state: ERP_STATE.otherErp },
  { name: "Je n'ai pas d'ERP", state: ERP_STATE.noErp },
];

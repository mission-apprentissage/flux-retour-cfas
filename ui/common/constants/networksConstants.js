/**
 * Noms des réseaux de CFAS
 */
export const RESEAUX_CFAS = {
  ADEN: {
    nomReseau: "ADEN",
    label: "ADEN",
    nomFichier: "",
  },
  CMA: {
    nomReseau: "CMA",
    label: "CMA",
    nomFichier: "cfas-cma",
  },
  AGRI: {
    nomReseau: "AGRI",
    label: "AGRI",
    nomFichier: "cfas-agri-no-mfr",
  },
  ANASUP: {
    nomReseau: "ANASUP",
    label: "ANASUP",
    nomFichier: "cfas-anasup",
  },
  CCI: {
    nomReseau: "CCI",
    label: "CCI",
    nomFichier: "cfas-cci",
  },
  CFA_EC: {
    nomReseau: "CFA EC",
    label: "EXCELLENCE PRO",
    nomFichier: "",
  },
  COMP_DU_DEVOIR: {
    nomReseau: "Compagnons du devoir",
    label: "COMPAGNONS DU DEVOIR",
  },
  GRETA: {
    nomReseau: "GRETA",
    label: "GRETA",
    nomFichier: "cfas-greta",
  },
  UIMM: {
    nomReseau: "UIMM",
    label: "UIMM",
    nomFichier: "cfas-uimm",
  },
  BTP_CFA: {
    nomReseau: "BTP CFA",
    label: "BTP CFA",
    nomFichier: "cfas-btp-cfa",
  },
  MFR: {
    nomReseau: "MFR",
    label: "MFR",
    nomFichier: "cfas-mfr",
  },
  AFTRAL: {
    nomReseau: "AFTRAL",
    label: "AFTRAL",
    nomFichier: "cfas-aftral",
  },
  GRETA_VAUCLUSE: {
    nomReseau: "GRETA VAUCLUSE",
    label: "GRETA VAUCLUSE",
    nomFichier: "",
  },
  CFA_SAT: {
    nomReseau: "CFA SAT",
    label: "CFA SAT",
    nomFichier: "",
  },
};

export const getReseauDisplayNameFromKey = (reseauKey) => RESEAUX_CFAS[reseauKey]?.label;

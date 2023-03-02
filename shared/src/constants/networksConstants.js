/**
 * Noms des réseaux de CFAS
 */
export const RESEAUX_CFAS = {
    ADEN: {
        nomReseau: "ADEN",
        label: "ADEN",
    },
    CMA: {
        nomReseau: "CMA",
        label: "CMA",
    },
    AGRI: {
        nomReseau: "AGRI",
        label: "AGRI",
    },
    ANASUP: {
        nomReseau: "ANASUP",
        label: "ANASUP",
    },
    CCI: {
        nomReseau: "CCI",
        label: "CCI",
    },
    CFA_EC: {
        nomReseau: "CFA EC",
        label: "EXCELLENCE PRO",
    },
    COMP_DU_DEVOIR: {
        nomReseau: "Compagnons du devoir",
        label: "COMPAGNONS DU DEVOIR",
    },
    GRETA: {
        nomReseau: "GRETA",
        label: "GRETA",
    },
    UIMM: {
        nomReseau: "UIMM",
        label: "UIMM",
    },
    BTP_CFA: {
        nomReseau: "BTP CFA",
        label: "BTP CFA",
    },
    MFR: {
        nomReseau: "MFR",
        label: "MFR",
    },
    AFTRAL: {
        nomReseau: "AFTRAL",
        label: "AFTRAL",
    },
    GRETA_VAUCLUSE: {
        nomReseau: "GRETA VAUCLUSE",
        label: "GRETA VAUCLUSE",
    },
    CFA_SAT: {
        nomReseau: "CFA SAT",
        label: "CFA SAT",
    },
};
export const getReseauDisplayNameFromKey = (reseauKey) => RESEAUX_CFAS[reseauKey]?.label;

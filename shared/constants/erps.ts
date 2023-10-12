import { sortAlphabeticallyBy } from "../utils";

interface ERP {
  id: string;
  name: string;
  helpFilePath?: string;
  helpFileSize?: string;
  apiV3?: boolean;
}

export const ERPS = sortAlphabeticallyBy("name", [
  {
    id: "gesti",
    name: "Gesti",
    helpFilePath: "https://files.tableau-de-bord.apprentissage.beta.gouv.fr/pas-a-pas/gesti.pdf",
    helpFileSize: "352 ko",
  },
  {
    id: "ymag",
    name: "Ypareo",
    helpFilePath: "https://files.tableau-de-bord.apprentissage.beta.gouv.fr/pas-a-pas/ypareo.pdf",
    helpFileSize: "1.7 Mo",
  },
  {
    id: "scform",
    name: "SC Form",
    apiV3: true,
  },
  {
    id: "formasup",
    name: "Formasup",
  },
  {
    id: "fcamanager",
    name: "FCA Manager",
    helpFilePath: "https://files.tableau-de-bord.apprentissage.beta.gouv.fr/pas-a-pas/fcamanager.pdf",
    helpFileSize: "288 ko",
  },
  {
    id: "auriga",
    name: "Auriga",
    apiV3: true,
  },
] satisfies ERP[]);

export const ERPS_BY_ID = ERPS.reduce(
  (acc, erp) => {
    acc[erp.id] = erp;
    return acc;
  },
  {} as Record<string, ERP>
);

// obsolète, utilisé par les anciens composants uniquement
export const ERPS_FORM: any[] = [
  ...ERPS,
  { id: "AUTRE", name: "Autre ERP", state: "otherErp" },
  { id: "NON", name: "Je n'ai pas d'ERP", state: "noErp" },
];

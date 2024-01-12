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
    apiV3: true,
    helpFilePath: "/Gestibase-2024.pdf",
  },
  {
    id: "ymag",
    name: "Ypareo",
    apiV3: true,
    helpFilePath: "/Ypareo-2023.pdf",
  },
  {
    id: "scform",
    name: "SC Form",
    apiV3: true,
    helpFilePath: "/SC-form-2023.pdf",
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

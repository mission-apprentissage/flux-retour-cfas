import { Db } from "mongodb";

export const up = async (db: Db) => {
  const erpToInsert = [
    {
      name: "Gesti",
      apiV3: true,
      helpFilePath: "/Gestibase-2024.pdf",
    },
    {
      name: "Ypareo",
      apiV3: true,
      helpFilePath: "/Ypareo-2024.pdf",
    },
    {
      name: "SC Form",
      apiV3: true,
      helpFilePath: "/SC-form-2024.pdf",
    },
    {
      name: "Formasup",
    },
    {
      name: "FCA Manager",
      helpFilePath: "https://files.tableau-de-bord.apprentissage.beta.gouv.fr/pas-a-pas/fcamanager.pdf",
      helpFileSize: "288 ko",
    },
    {
      name: "Aimaira",
      apiV3: true,
      helpFilePath: "/Aimaira-2024.pdf",
    },
    {
      name: "Filiz",
      apiV3: true,
    },
    {
      name: "Hyperplanning",
      apiV3: true,
    },
    {
      name: "Gescicca (CNAM)",
      apiV3: true,
    },
    {
      name: "Charlemagne",
      apiV3: true,
    },
    {
      name: "Formasup HDF",
      apiV3: true,
    },
    {
      name: "Ammon",
      apiV3: true,
    },
    {
      name: "Formasup PACA",
      apiV3: true,
    },
  ];

  for (let i = 0; i < erpToInsert.length; i++) {
    await db.collection("erp").insertOne(erpToInsert[i]);
  }
};

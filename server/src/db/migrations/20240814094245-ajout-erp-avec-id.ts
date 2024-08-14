import { ObjectId } from "mongodb";

import { erpDb } from "@/common/model/collections";

export const up = async () => {
  const erpToInsert = [
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
      helpFilePath: "/Ypareo-2024.pdf",
    },
    {
      id: "scform",
      name: "SC Form",
      apiV3: true,
      helpFilePath: "/SC-form-2024.pdf",
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
      id: "aimaira",
      name: "Aimaira",
      apiV3: true,
      helpFilePath: "/Aimaira-2024.pdf",
    },
    {
      id: "filiz",
      name: "Filiz",
      apiV3: true,
    },
    {
      id: "hyperplanning",
      name: "Hyperplanning",
      apiV3: true,
    },
    {
      id: "gescicca",
      name: "Gescicca (CNAM)",
      apiV3: true,
    },
    {
      id: "charlemagne",
      name: "Charlemagne",
      apiV3: true,
    },
    {
      id: "formasup-hdf",
      name: "Formasup HDF",
      apiV3: true,
    },
  ];
  await erpDb().deleteMany({});
  for (let i = 0; i < erpToInsert.length; i++) {
    const erp = erpToInsert[i];
    const { name, apiV3, helpFilePath, helpFileSize, id } = erp;
    await erpDb().insertOne({
      _id: new ObjectId(),
      created_at: new Date(),
      name,
      apiV3,
      helpFilePath,
      helpFileSize,
      unique_id: id,
    });
  }
};

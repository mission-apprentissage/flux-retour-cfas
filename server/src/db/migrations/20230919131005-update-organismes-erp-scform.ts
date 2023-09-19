import { PromisePool } from "@supercharge/promise-pool";
import csvToJson from "convert-csv-to-json";
import { Db, MongoClient } from "mongodb";
import { accumulateData, oleoduc, writeData } from "oleoduc";

import { organismesDb } from "@/common/model/collections";
import { getFromStorage } from "@/common/utils/ovhUtils";

export const up = async (_db: Db, _client: MongoClient) => {
  // Récupération de la liste depuis le storage
  const FILE_PATH = "cfas-clients-erps/clients-scform.csv";
  const stream = await getFromStorage(FILE_PATH);

  let fileContent = [];

  await oleoduc(
    stream,
    accumulateData(
      (acc, value) => {
        return Buffer.concat([acc, Buffer.from(value)]);
      },
      { accumulator: Buffer.from(new Uint8Array()) }
    ),
    writeData(async (data) => {
      fileContent = csvToJson.latin1Encoding().csvStringToJson(data.toString());
    })
  );

  // Traitement // sur toutes les lignes du fichier
  await PromisePool.for(fileContent).process(async ({ siret }: any) => {
    await organismesDb().updateMany({ siret }, { $addToSet: { erps: "scform" } });
  });
};

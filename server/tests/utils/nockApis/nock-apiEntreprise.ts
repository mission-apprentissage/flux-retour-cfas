import { readdirSync, readFileSync } from "fs";

import nock from "nock";

import { API_ENDPOINT } from "@/common/apis/apiEntreprise";

const jsonEtablissementDataDir = `${process.cwd()}/tests/data/entreprise.api.gouv.fr/etablissements`;
const realEtablissementDataBySiret = readdirSync(jsonEtablissementDataDir).reduce((acc, jsonFilename) => {
  acc[jsonFilename.replace(".json", "")] = JSON.parse(
    readFileSync(`${jsonEtablissementDataDir}/${jsonFilename}`).toString()
  );
  return acc;
}, {});

export const nockGetEtablissement = (callback?: any) => {
  nock(API_ENDPOINT)
    .persist()
    .get(new RegExp("\\/insee\\/sirene\\/etablissements.*"))
    .reply(200, (uri) => {
      const siret = uri.replace(/(\/v3\/insee\/sirene\/etablissements\/)([0-9]*).*/, "$2");
      return callback ? callback(siret) : realEtablissementDataBySiret[siret];
    });
};

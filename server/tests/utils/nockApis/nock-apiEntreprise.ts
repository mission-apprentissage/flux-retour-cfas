import { readdirSync, readFileSync } from "fs";
import path from "path";

import nock from "nock";

import { API_ENDPOINT } from "@/common/apis/ApiEntreprise";
import { __dirname } from "@/common/utils/esmUtils";

const jsonEtablissementDataDir = path.join(
  __dirname(import.meta.url),
  `../../data/entreprise.api.gouv.fr/etablissements`
);
const realEtablissementDataBySiret = readdirSync(jsonEtablissementDataDir).reduce((acc, jsonFilename) => {
  acc[jsonFilename.replace(".json", "")] = JSON.parse(
    readFileSync(`${jsonEtablissementDataDir}/${jsonFilename}`).toString()
  );
  return acc;
}, {});

export const nockGetEtablissement = (callback?: any) => {
  nock(API_ENDPOINT)
    .persist()
    .get(new RegExp("\\/insee\\/sirene\\/etablissements\\/diffusibles.*"))
    .reply(200, (uri) => {
      const siret = uri.replace(/(\/v3\/insee\/sirene\/etablissements\/diffusibles\/)([0-9]*).*/, "$2");
      return callback ? callback(siret) : realEtablissementDataBySiret[siret];
    });
};

import nock from "nock";
import { readdirSync, readFileSync } from "fs";

import { API_ENDPOINT } from "../../../src/common/apis/ApiEntreprise.js";

const jsonEtablissementDataDir = `${process.cwd()}/tests/data/entreprise.api.gouv.fr/etablissements`;
const realEtablissementDataBySiret = readdirSync(jsonEtablissementDataDir).reduce((acc, jsonFilename) => {
  acc[jsonFilename.replace(".json", "")] = JSON.parse(
    readFileSync(`${jsonEtablissementDataDir}/${jsonFilename}`).toString()
  );
  return acc;
}, {});

const jsonEntrepriseDataDir = `${process.cwd()}/tests/data/entreprise.api.gouv.fr/entreprises`;
const realEnterpriseDataBySiret = readdirSync(jsonEntrepriseDataDir).reduce((acc, jsonFilename) => {
  acc[jsonFilename.replace(".json", "")] = JSON.parse(
    readFileSync(`${jsonEntrepriseDataDir}/${jsonFilename}`).toString()
  );
  return acc;
}, {});

export const nockGetEtablissement = (callback) => {
  nock(API_ENDPOINT)
    .persist()
    .get(/\/etablissements\/.*/)
    .reply(200, (uri) => {
      const siret = uri.replace(/(\/v2\/etablissements\/)([0-9]*).*/, "$2");
      return callback ? callback(siret) : realEtablissementDataBySiret[siret];
    });
};

export const nockGetEntreprise = (callback) => {
  nock(API_ENDPOINT)
    .persist()
    .get(/\/entreprises\/.*/)
    .reply(200, (uri) => {
      const siren = uri.replace(/(\/v2\/entreprises\/)([0-9]*).*/, "$2");
      return callback ? callback(siren) : realEnterpriseDataBySiret[siren];
    });
};

import nock from "nock";

import dataCfd50033610 from "./cfd-50033610";
import dataCfd50033616 from "./cfd-50033616";
import dataRncp34670 from "./rncp-34670";
import dataRncp5364 from "./rncp-5364";

export function mockApiApprentissageCertificationApi() {
  nock("https://api.apprentissage.beta.gouv.fr")
    .get("/api/certification/v1")
    .query({ "identifiant.rncp": "RNCP5364" })
    .reply(200, dataRncp5364)

    .get("/api/certification/v1")
    .query({ "identifiant.rncp": "RNCP34670" })
    .reply(200, dataRncp34670)

    .get("/api/certification/v1")
    .query({ "identifiant.cfd": "50033610" })
    .reply(200, dataCfd50033610)

    .get("/api/certification/v1")
    .query({ "identifiant.cfd": "50033616" })
    .reply(200, dataCfd50033616)

    .get("/api/certification/v1")
    .query({ "identifiant.cfd": "77733777" })
    .reply(200, []);
}

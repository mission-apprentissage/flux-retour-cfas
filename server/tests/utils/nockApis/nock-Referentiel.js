/* eslint-disable node/no-unpublished-require */
const nock = require("nock");
const config = require("../../../config");
const {
  INEXISTANT_UAI,
  SAMPLE_UAI_UNIQUE_ORGANISME,
  sampleUniqueOrganismeFromReferentiel,
  SAMPLE_UAI_MULTIPLES_ORGANISMES,
  sampleMultiplesOrganismesFromReferentiel,
} = require("../../data/apiReferentielMna.js");

const API_ENDPOINT = config.mnaReferentielApi.endpoint;

const nockFetchOrganismesWithUai = () => {
  nock(API_ENDPOINT).persist().get(`/organismes?uais=${INEXISTANT_UAI}`).reply(500, null);

  nock(API_ENDPOINT)
    .persist()
    .get(`/organismes?uais=${SAMPLE_UAI_UNIQUE_ORGANISME}`)
    .reply(200, sampleUniqueOrganismeFromReferentiel);

  nock(API_ENDPOINT)
    .persist()
    .get(`/organismes?uais=${SAMPLE_UAI_MULTIPLES_ORGANISMES}`)
    .reply(200, sampleMultiplesOrganismesFromReferentiel);
};

module.exports = {
  nockFetchOrganismesWithUai,
};

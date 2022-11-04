const assert = require("assert").strict;
const {
  INEXISTANT_UAI,
  SAMPLE_UAI_UNIQUE_ORGANISME,
  sampleUniqueOrganismeFromReferentiel,
  SAMPLE_UAI_MULTIPLES_ORGANISMES,
  sampleMultiplesOrganismesFromReferentiel,
} = require("../../../data/apiReferentielMna.js");
const { startServer } = require("../../../utils/testUtils");

describe("API Route Organismes", () => {
  it("renvoie une 400 quand l'uai n'est pas au bon format", async () => {
    const { httpClient } = await startServer();

    const badFormatUai = "badFormat";
    const response = await httpClient.get(`/api/partage-simplifie/organismes/${badFormatUai}`);
    assert.equal(response.status, 400);
    assert.equal(response.data.message, "Erreur de validation");
  });

  it("renvoie une 200 avec une liste d'organismes vides quand l'uai est inexistant", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get(`/api/partage-simplifie/organismes/${INEXISTANT_UAI}`);
    assert.equal(response.status, 200);
    assert.equal(response.data.organismes.length === 0, true);
  });

  it("renvoie une 200 avec une liste d'un seul bon organisme quand l'uai est valide", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get(`/api/partage-simplifie/organismes/${SAMPLE_UAI_UNIQUE_ORGANISME}`);
    assert.equal(response.status, 200);
    assert.equal(response.data.organismes !== null, true);
    assert.equal(response.data.organismes.length === 1, true);

    assert.equal(response.data.organismes[0].uai === sampleUniqueOrganismeFromReferentiel.organismes[0].uai, true);
    assert.equal(response.data.organismes[0].siret === sampleUniqueOrganismeFromReferentiel.organismes[0].siret, true);
    assert.equal(
      response.data.organismes[0].siren === sampleUniqueOrganismeFromReferentiel.organismes[0].siret.substring(0, 8),
      true
    );
    assert.equal(
      response.data.organismes[0].nature === sampleUniqueOrganismeFromReferentiel.organismes[0].nature,
      true
    );
    assert.deepEqual(
      response.data.organismes[0].reseaux,
      sampleUniqueOrganismeFromReferentiel.organismes[0].reseaux?.map((item) => item.label)
    );
    assert.equal(
      response.data.organismes[0].nom_etablissement ===
        sampleUniqueOrganismeFromReferentiel.organismes[0].raison_sociale,
      true
    );
    assert.equal(
      response.data.organismes[0].adresse === sampleUniqueOrganismeFromReferentiel.organismes[0].adresse?.label,
      true
    );
    assert.equal(
      response.data.organismes[0].region === sampleUniqueOrganismeFromReferentiel.organismes[0].adresse?.region?.nom,
      true
    );
    assert.equal(
      response.data.organismes[0].academie ===
        sampleUniqueOrganismeFromReferentiel.organismes[0].adresse?.academie?.nom,
      true
    );
  });

  it("renvoie une 200 avec une liste de plusieurs organismes quand l'uai est valide", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get(`/api/partage-simplifie/organismes/${SAMPLE_UAI_MULTIPLES_ORGANISMES}`);
    assert.equal(response.status, 200);
    assert.equal(response.data.organismes !== null, true);
    assert.equal(response.data.organismes.length === 2, true);

    for (let index = 0; index < response.data.organismes.length; index++) {
      // 1er élément
      assert.equal(
        response.data.organismes[index].uai === sampleMultiplesOrganismesFromReferentiel.organismes[index].uai,
        true
      );
      assert.equal(
        response.data.organismes[index].siret === sampleMultiplesOrganismesFromReferentiel.organismes[index].siret,
        true
      );
      assert.equal(
        response.data.organismes[index].siren ===
          sampleMultiplesOrganismesFromReferentiel.organismes[index].siret.substring(0, 8),
        true
      );
      assert.equal(
        response.data.organismes[index].nature === sampleMultiplesOrganismesFromReferentiel.organismes[index].nature,
        true
      );
      assert.deepEqual(
        response.data.organismes[index].reseaux,
        sampleMultiplesOrganismesFromReferentiel.organismes[index].reseaux?.map((item) => item.label)
      );
      assert.equal(
        response.data.organismes[index].nom_etablissement ===
          sampleMultiplesOrganismesFromReferentiel.organismes[index].raison_sociale,
        true
      );
      assert.equal(
        response.data.organismes[index].adresse ===
          sampleMultiplesOrganismesFromReferentiel.organismes[index].adresse?.label,
        true
      );
      assert.equal(
        response.data.organismes[index].region ===
          sampleMultiplesOrganismesFromReferentiel.organismes[index].adresse?.region?.nom,
        true
      );
      assert.equal(
        response.data.organismes[index].academie ===
          sampleMultiplesOrganismesFromReferentiel.organismes[index].adresse?.academie?.nom,
        true
      );
    }
  });
});

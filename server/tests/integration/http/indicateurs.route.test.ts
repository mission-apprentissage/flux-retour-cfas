import { AxiosInstance } from "axiosist";

import { Effectif } from "@/common/model/@types";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { historySequenceApprentiToAbandon, historySequenceInscritToApprenti } from "@tests/data/historySequenceSamples";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import {
  PermissionsTestConfig,
  commonEffectifsAttributes,
  organismes,
  testPermissions,
  userOrganisme,
} from "@tests/utils/permissions";
import { RequestAsOrganisationFunc, expectUnauthorizedError, id, initTestApp } from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("Route indicateurs", () => {
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });
  beforeEach(async () => {
    await organismesDb().insertMany(organismes);
  });

  describe("GET /api/v1/indicateurs/effectifs - indicateurs sur les effectifs", () => {
    const date = "2022-10-10T00:00:00.000Z";
    const anneeScolaire = "2022-2023";

    beforeEach(async () => {
      await effectifsDb().insertOne(
        createSampleEffectif({
          ...commonEffectifsAttributes,
          annee_scolaire: anneeScolaire,
          apprenant: {
            historique_statut: historySequenceInscritToApprenti,
          },
        })
      );
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get(`/api/v1/indicateurs/effectifs?date=${date}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      const accesOrganisme: PermissionsTestConfig<number> = {
        "OFF lié": 1,
        "OFF non lié": 0,
        "OFR lié": 1,
        "OFR responsable": 1,
        "OFR non lié": 0,
        "OFRF lié": 1,
        "OFRF responsable": 1,
        "OFRF non lié": 0,
        "Tête de réseau": 1,
        "Tête de réseau non liée": 0,
        "DREETS même région": 1,
        "DREETS autre région": 1,
        "DDETS même département": 1,
        "DDETS autre département": 1,
        "ACADEMIE même académie": 1,
        "ACADEMIE autre académie": 1,
        "Opérateur public national": 1,
        Administrateur: 1,
      };
      testPermissions(accesOrganisme, async (organisation, nbApprentis) => {
        const response = await requestAsOrganisation(organisation, "get", `/api/v1/indicateurs/effectifs?date=${date}`);

        expect(response.status).toStrictEqual(200);
        expect(response.data).toStrictEqual(
          nbApprentis > 0
            ? [
                {
                  departement: "56",
                  apprenants: nbApprentis,
                  apprentis: nbApprentis,
                  inscritsSansContrat: 0,
                  rupturants: 0,
                  abandons: 0,
                },
              ]
            : []
        );
      });
    });

    // TODO vérifier chaque filtre
  });

  describe("GET /api/v1/indicateurs/organismes - indicateurs sur les effectifs", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get("/api/v1/indicateurs/organismes");

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      const accesOrganisme: PermissionsTestConfig<number> = {
        "OFF lié": 1,
        "OFF non lié": 1,
        "OFR lié": 1,
        "OFR responsable": 2,
        "OFR non lié": 1,
        "OFRF lié": 1,
        "OFRF responsable": 3,
        "OFRF non lié": 1,
        "Tête de réseau": 4,
        "Tête de réseau non liée": 0,
        "DREETS même région": 4,
        "DREETS autre région": 4,
        "DDETS même département": 4,
        "DDETS autre département": 4,
        "ACADEMIE même académie": 4,
        "ACADEMIE autre académie": 4,
        "Opérateur public national": 4,
        Administrateur: 4,
      };
      testPermissions(accesOrganisme, async (organisation, nbOrganismes) => {
        const response = await requestAsOrganisation(organisation, "get", "/api/v1/indicateurs/organismes");

        expect(response.status).toStrictEqual(200);
        expect(response.data).toStrictEqual(
          nbOrganismes > 0
            ? [
                {
                  departement: "56",
                  tauxCouverture: 100,
                  totalOrganismes: nbOrganismes,
                  organismesTransmetteurs: nbOrganismes,
                  organismesNonTransmetteurs: 0,
                },
              ]
            : []
        );
      });
    });

    // TODO vérifier chaque filtre
  });

  describe("GET /api/v1/indicateurs/effectifs/par-organisme - indicateurs sur les effectifs", () => {
    const date = "2022-10-10T00:00:00.000Z";
    const anneeScolaire = "2022-2023";

    beforeEach(async () => {
      await effectifsDb().insertOne(
        createSampleEffectif({
          ...commonEffectifsAttributes,
          annee_scolaire: anneeScolaire,
          apprenant: {
            historique_statut: historySequenceInscritToApprenti,
          },
        })
      );
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get(`/api/v1/indicateurs/effectifs/par-organisme?date=${date}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      const accesOrganisme: PermissionsTestConfig<number> = {
        "OFF lié": 1,
        "OFF non lié": 0,
        "OFR lié": 1,
        "OFR responsable": 1,
        "OFR non lié": 0,
        "OFRF lié": 1,
        "OFRF responsable": 1,
        "OFRF non lié": 0,
        "Tête de réseau": 1,
        "Tête de réseau non liée": 0,
        "DREETS même région": 1,
        "DREETS autre région": 0,
        "DDETS même département": 1,
        "DDETS autre département": 0,
        "ACADEMIE même académie": 1,
        "ACADEMIE autre académie": 0,
        "Opérateur public national": 1,
        Administrateur: 1,
      };
      testPermissions(accesOrganisme, async (organisation, nbApprentis) => {
        const response = await requestAsOrganisation(
          organisation,
          "get",
          `/api/v1/indicateurs/effectifs/par-organisme?date=${date}`
        );

        expect(response.status).toStrictEqual(200);
        expect(response.data).toStrictEqual(
          nbApprentis > 0
            ? [
                {
                  organisme_id: id(1),
                  nom: "ADEN Formations (Caen)",
                  nature: "formateur",
                  siret: "00000000000018",
                  uai: "0000000A",
                  apprenants: nbApprentis,
                  apprentis: nbApprentis,
                  inscritsSansContrat: 0,
                  rupturants: 0,
                  abandons: 0,
                },
              ]
            : []
        );
      });
    });

    // TODO vérifier chaque filtre
  });

  describe("GET /api/v1/indicateurs/effectifs/:type - indicateurs sur les effectifs", () => {
    const date = "2022-10-10T00:00:00.000Z";
    const anneeScolaire = "2022-2023";

    let effectif: Effectif;

    beforeEach(async () => {
      effectif = createSampleEffectif({
        ...commonEffectifsAttributes,
        annee_scolaire: anneeScolaire,
        apprenant: {
          historique_statut: historySequenceApprentiToAbandon,
        },
      });
      await effectifsDb().insertOne(effectif);
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get(`/api/v1/indicateurs/effectifs/abandons?date=${date}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      const accesOrganisme: PermissionsTestConfig<boolean> = {
        "OFF lié": true,
        "OFF non lié": false,
        "OFR lié": true,
        "OFR responsable": true,
        "OFR non lié": false,
        "OFRF lié": true,
        "OFRF responsable": true,
        "OFRF non lié": false,
        "Tête de réseau": true,
        "Tête de réseau non liée": false,
        "DREETS même région": true,
        "DREETS autre région": false,
        "DDETS même département": true,
        "DDETS autre département": false,
        "ACADEMIE même académie": true,
        "ACADEMIE autre académie": false,
        "Opérateur public national": true,
        Administrateur: true,
      };
      testPermissions(accesOrganisme, async (organisation, hasAccess) => {
        const response = await requestAsOrganisation(
          organisation,
          "get",
          `/api/v1/indicateurs/effectifs/abandons?date=${date}`
        );

        expect(response.status).toStrictEqual(200);
        expect(response.data).toStrictEqual(
          hasAccess
            ? [
                {
                  apprenant_date_de_naissance: effectif.apprenant.date_de_naissance?.toISOString().substring(0, 10),
                  apprenant_nom: effectif.apprenant.nom,
                  apprenant_prenom: effectif.apprenant.prenom,
                  formation_annee: effectif.formation?.annee,
                  formation_cfd: effectif.formation?.cfd,
                  formation_date_debut_formation: effectif.formation?.periode?.[0],
                  formation_date_fin_formation: effectif.formation?.periode?.[1],
                  formation_libelle_long: effectif.formation?.libelle_long,
                  formation_niveau: effectif.formation?.niveau,
                  formation_rncp: effectif.formation?.rncp,
                  organisme_nature: userOrganisme.nature,
                  organisme_nom: userOrganisme.raison_sociale,
                  organisme_siret: userOrganisme.siret,
                  organisme_uai: userOrganisme.uai,
                },
              ]
            : []
        );
      });
    });

    // TODO vérifier chaque filtre
  });
});

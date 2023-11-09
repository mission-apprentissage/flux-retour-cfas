import { AxiosInstance } from "axiosist";

import { IndicateursEffectifsAvecOrganisme } from "@/common/actions/indicateurs/indicateurs";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { historySequenceApprentiToAbandon, historySequenceInscritToApprenti } from "@tests/data/historySequenceSamples";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import {
  PermissionsTestConfig,
  commonEffectifsAttributes,
  organismes,
  testPermissions,
  userOrganisme,
} from "@tests/utils/permissions";
import {
  RequestAsOrganisationFunc,
  expectForbiddenError,
  expectUnauthorizedError,
  id,
  initTestApp,
} from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("Route indicateurs", () => {
  useMongo();
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });
  beforeEach(async () => {
    await organismesDb().insertMany(organismes);
  });

  describe("GET /api/v1/indicateurs/effectifs/par-departement - indicateurs sur les effectifs par département", () => {
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
      const response = await httpClient.get(`/api/v1/indicateurs/effectifs/par-departement?date=${date}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      const accesOrganisme: PermissionsTestConfig<number> = {
        "OF cible": 1,
        "OF non lié": 0,
        "OF formateur": 0,
        "OF responsable": 1,
        "Tête de réseau même réseau": 1,
        "Tête de réseau autre réseau": 0,
        "DREETS même région": 1,
        "DREETS autre région": 1,
        "DRAAF même région": 1,
        "DRAAF autre région": 1,
        "Conseil Régional même région": 1,
        "Conseil Régional autre région": 1,
        "CARIF OREF régional même région": 1,
        "CARIF OREF régional autre région": 1,
        "DDETS même département": 1,
        "DDETS autre département": 1,
        "Académie même académie": 1,
        "Académie autre académie": 1,
        "Opérateur public national": 1,
        "CARIF OREF national": 1,
        Administrateur: 1,
      };
      testPermissions(accesOrganisme, async (organisation, nbApprentis) => {
        const response = await requestAsOrganisation(
          organisation,
          "get",
          `/api/v1/indicateurs/effectifs/par-departement?date=${date}`
        );

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

  describe("GET /api/v1/indicateurs/organismes/par-departement - indicateurs sur les organismes par département", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get("/api/v1/indicateurs/organismes/par-departement");

      expectUnauthorizedError(response);
    });

    describe("Permissions", () => {
      const accesOrganisme: PermissionsTestConfig<number> = {
        "OF cible": 2,
        "OF non lié": 1,
        "OF formateur": 1,
        "OF responsable": 2,
        "Tête de réseau même réseau": 4,
        "Tête de réseau autre réseau": 0,
        "DREETS même région": 4,
        "DREETS autre région": 4,
        "DRAAF même région": 4,
        "DRAAF autre région": 4,
        "Conseil Régional même région": 4,
        "Conseil Régional autre région": 4,
        "CARIF OREF régional même région": 4,
        "CARIF OREF régional autre région": 4,
        "DDETS même département": 4,
        "DDETS autre département": 4,
        "Académie même académie": 4,
        "Académie autre académie": 4,
        "Opérateur public national": 4,
        "CARIF OREF national": 4,
        Administrateur: 4,
      };
      testPermissions(accesOrganisme, async (organisation, nbOrganismes) => {
        const response = await requestAsOrganisation(
          organisation,
          "get",
          "/api/v1/indicateurs/organismes/par-departement"
        );

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

  describe("GET /api/v1/indicateurs/effectifs/par-organisme - indicateurs sur les effectifs par organisme", () => {
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
        "OF cible": 1,
        "OF non lié": 0,
        "OF formateur": 0,
        "OF responsable": 1,
        "Tête de réseau même réseau": 1,
        "Tête de réseau autre réseau": 0,
        "DREETS même région": 1,
        "DREETS autre région": 0,
        "DRAAF même région": 1,
        "DRAAF autre région": 0,
        "Conseil Régional même région": 1,
        "Conseil Régional autre région": 0,
        "CARIF OREF régional même région": 1,
        "CARIF OREF régional autre région": 0,
        "DDETS même département": 1,
        "DDETS autre département": 0,
        "Académie même académie": 1,
        "Académie autre académie": 0,
        "Opérateur public national": 1,
        "CARIF OREF national": 1,
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
                  nature: "responsable_formateur",
                  siret: "00000000000018",
                  uai: "0000000A",
                  apprenants: nbApprentis,
                  apprentis: nbApprentis,
                  inscritsSansContrat: 0,
                  rupturants: 0,
                  abandons: 0,
                } satisfies IndicateursEffectifsAvecOrganisme,
              ]
            : []
        );
      });
    });

    // TODO vérifier chaque filtre
  });

  describe("GET /api/v1/indicateurs/effectifs/:type - effectifs nominatifs", () => {
    const date = "2022-10-10T00:00:00.000Z";
    const anneeScolaire = "2022-2023";

    let effectifResult: any[] = [];
    const emptyResult = [];

    beforeEach(async () => {
      const effectif = createSampleEffectif({
        ...commonEffectifsAttributes,
        annee_scolaire: anneeScolaire,
        apprenant: {
          historique_statut: historySequenceApprentiToAbandon,
        },
      });
      await effectifsDb().insertOne(effectif);

      // petit hack pour muter l'objet :-°
      effectifResult.splice(0, 1, {
        apprenant_date_de_naissance: effectif.apprenant.date_de_naissance?.toISOString().substring(0, 10),
        apprenant_nom: effectif.apprenant.nom,
        apprenant_prenom: effectif.apprenant.prenom,
        apprenant_statut: "abandon",
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
      });
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const response = await httpClient.get(`/api/v1/indicateurs/effectifs/abandon?date=${date}`);

      expectUnauthorizedError(response);
    });

    describe("Permissions abandon", () => {
      const accesOrganisme: PermissionsTestConfig<false | any[]> = {
        "OF cible": false, // car il possède un formateur, mais y accède théoriquement
        "OF non lié": emptyResult,
        "OF formateur": emptyResult,
        "OF responsable": false,
        "Tête de réseau même réseau": false,
        "Tête de réseau autre réseau": false,
        "DREETS même région": effectifResult,
        "DREETS autre région": emptyResult,
        "DRAAF même région": effectifResult,
        "DRAAF autre région": emptyResult,
        "Conseil Régional même région": false,
        "Conseil Régional autre région": false,
        "CARIF OREF régional même région": false,
        "CARIF OREF régional autre région": false,
        "DDETS même département": effectifResult,
        "DDETS autre département": emptyResult,
        "Académie même académie": effectifResult,
        "Académie autre académie": emptyResult,
        "Opérateur public national": false,
        "CARIF OREF national": false,
        Administrateur: effectifResult,
      };
      testPermissions(accesOrganisme, async (organisation, expectedPermission) => {
        const response = await requestAsOrganisation(
          organisation,
          "get",
          `/api/v1/indicateurs/effectifs/abandon?date=${date}`
        );

        if (expectedPermission) {
          expect(response.status).toStrictEqual(200);
          expect(response.data).toStrictEqual(expectedPermission);
        } else {
          expectForbiddenError(response);
        }
      });
    });

    describe("Permissions apprenti", () => {
      const accesOrganisme: PermissionsTestConfig<false | any[]> = {
        "OF cible": false, // car il possède un formateur, mais y accède théoriquement
        "OF non lié": emptyResult,
        "OF formateur": emptyResult,
        "OF responsable": false,
        "Tête de réseau même réseau": false,
        "Tête de réseau autre réseau": false,
        "DREETS même région": false,
        "DREETS autre région": false,
        "DRAAF même région": false,
        "DRAAF autre région": false,
        "Conseil Régional même région": false,
        "Conseil Régional autre région": false,
        "CARIF OREF régional même région": false,
        "CARIF OREF régional autre région": false,
        "DDETS même département": false,
        "DDETS autre département": false,
        "Académie même académie": false,
        "Académie autre académie": false,
        "Opérateur public national": false,
        "CARIF OREF national": false,
        Administrateur: emptyResult,
      };
      testPermissions(accesOrganisme, async (organisation, expectedPermission) => {
        const response = await requestAsOrganisation(
          organisation,
          "get",
          `/api/v1/indicateurs/effectifs/apprenti?date=${date}`
        );

        if (expectedPermission) {
          expect(response.status).toStrictEqual(200);
          expect(response.data).toStrictEqual(expectedPermission);
        } else {
          expectForbiddenError(response);
        }
      });
    });

    // TODO vérifier chaque filtre
  });
});

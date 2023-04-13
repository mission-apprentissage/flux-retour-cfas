import { strict as assert } from "assert";
import { ObjectId } from "mongodb";

import {
  stringifyMongoFields,
  expectForbiddenError,
  expectUnauthorizedError,
  id,
  initTestApp,
  PermissionTest,
  testPermissions,
  RequestAsOrganisationFunc,
} from "../../utils/testUtils.js";
import { AxiosInstance } from "axiosist";
import { organismesDb } from "../../../src/common/model/collections.js";
import { Organisme } from "@/src/common/model/@types/Organisme.js";

const commonOrganismeAttributes: Omit<{ [key in keyof Organisme]: Organisme[key] }, "_id" | "siret" | "uai"> = {
  adresse: {
    departement: "56", // morbihan
    region: "53", // bretagne
    academie: "14", // rennes
  },
  reseaux: ["CCI"],
  erps: ["YMAG"],
  nature: "responsable_formateur",
  nom: "ADEN Formations (Caen)",
  fiabilisation_statut: "INCONNU",
  metiers: [],
  relatedFormations: [],
  created_at: new Date("2023-04-12T18:00:00.000Z"),
  updated_at: new Date("2023-04-12T18:00:00.000Z"),
};

const organismes: Organisme[] = [
  // owner
  {
    _id: new ObjectId(id(1)),
    uai: "0142321X",
    siret: "41461021200014",
    ...commonOrganismeAttributes,
  },
  // other
  {
    _id: new ObjectId(id(2)),
    uai: "0142322X",
    siret: "77568013501089",
    ...commonOrganismeAttributes,
  },
];

const userOrganisme = organismes[0];

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("Routes organismes", () => {
  before(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });
  beforeEach(async () => {
    await organismesDb().insertMany(organismes);
  });

  const accesOrganisme: PermissionTest[] = [
    {
      label: "OF lié",
      organisation: {
        type: "ORGANISME_FORMATION_FORMATEUR",
        uai: "0142321X",
        siret: "41461021200014",
      },
      allowed: true,
    },
    {
      label: "OF non lié",
      organisation: {
        type: "ORGANISME_FORMATION_FORMATEUR",
        uai: "0142322X",
        siret: "77568013501089",
      },
      allowed: false,
    },
    {
      label: "Tête de réseau",
      organisation: {
        type: "TETE_DE_RESEAU",
        reseau: "CCI",
      },
      allowed: true,
    },
    {
      label: "Tête de réseau non liée",
      organisation: {
        type: "TETE_DE_RESEAU",
        reseau: "AGRI",
      },
      allowed: false,
    },
    {
      label: "DREETS même région",
      organisation: {
        type: "DREETS",
        code_region: "53",
      },
      allowed: true,
    },
    {
      label: "DREETS autre région",
      organisation: {
        type: "DREETS",
        code_region: "76",
      },
      allowed: false,
    },
    {
      label: "DDETS même département",
      organisation: {
        type: "DDETS",
        code_departement: "56",
      },
      allowed: true,
    },
    {
      label: "DDETS autre département",
      organisation: {
        type: "DDETS",
        code_departement: "31",
      },
      allowed: false,
    },
    {
      label: "Opérateur public national",
      organisation: {
        type: "OPERATEUR_PUBLIC_NATIONAL",
        nom: "Ministère de la Justice",
      },
      allowed: true,
    },
    {
      label: "Administrateur",
      organisation: {
        type: "ADMINISTRATEUR",
      },
      allowed: true,
    },
  ];

  describe("GET /organismes/:id - détail d'un organisme", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organisme/${id(1)}`);

      expectUnauthorizedError(response);
    });

    testPermissions(accesOrganisme, async (organisation, allowed) => {
      const response = await requestAsOrganisation(organisation, "get", `/api/v1/organismes/${id(1)}`);

      if (allowed) {
        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(response.data, stringifyMongoFields(userOrganisme));
      } else {
        expectForbiddenError(response);
      }
    });
  });

  describe("GET /organismes/:id/indicateurs - indicateurs d'un organisme", () => {
    const date = "2023-04-13T10:00:00.000Z";

    it("Erreur si non authentifié", async () => {
      const response = await httpClient.get(`/api/v1/organisme/${id(1)}/indicateurs?date=${date}`);

      expectUnauthorizedError(response);
    });

    testPermissions(accesOrganisme, async (organisation, allowed) => {
      const response = await requestAsOrganisation(
        organisation,
        "get",
        `/api/v1/organismes/${id(1)}/indicateurs?date=${date}`
      );

      if (allowed) {
        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(response.data, {
          date: date,
          apprentis: 0,
          inscritsSansContrat: 0,
          rupturants: 0,
          abandons: 0,
          totalOrganismes: 0,
        });
      } else {
        expectForbiddenError(response);
      }
    });
  });

  const configurationERP: PermissionTest[] = [
    {
      label: "OF lié",
      organisation: {
        type: "ORGANISME_FORMATION_FORMATEUR",
        uai: "0142321X",
        siret: "41461021200014",
      },
      allowed: true,
    },
    {
      label: "OF non lié",
      organisation: {
        type: "ORGANISME_FORMATION_FORMATEUR",
        uai: "0142322X",
        siret: "77568013501089",
      },
      allowed: false,
    },
    {
      label: "Tête de réseau",
      organisation: {
        type: "TETE_DE_RESEAU",
        reseau: "CCI",
      },
      allowed: false,
    },
    {
      label: "Tête de réseau non liée",
      organisation: {
        type: "TETE_DE_RESEAU",
        reseau: "AGRI",
      },
      allowed: false,
    },
    {
      label: "DREETS même région",
      organisation: {
        type: "DREETS",
        code_region: "53",
      },
      allowed: false,
    },
    {
      label: "DREETS autre région",
      organisation: {
        type: "DREETS",
        code_region: "76",
      },
      allowed: false,
    },
    {
      label: "ACADEMIE même région",
      organisation: {
        type: "ACADEMIE",
        code_academie: "14",
      },
      allowed: false,
    },
    {
      label: "ACADEMIE autre région",
      organisation: {
        type: "ACADEMIE",
        code_academie: "16",
      },
      allowed: false,
    },
    {
      label: "DDETS même département",
      organisation: {
        type: "DDETS",
        code_departement: "56",
      },
      allowed: false,
    },
    {
      label: "DDETS autre département",
      organisation: {
        type: "DDETS",
        code_departement: "31",
      },
      allowed: false,
    },
    {
      label: "Opérateur public national",
      organisation: {
        type: "OPERATEUR_PUBLIC_NATIONAL",
        nom: "Ministère de la Justice",
      },
      allowed: false,
    },
    {
      label: "Administrateur",
      organisation: {
        type: "ADMINISTRATEUR",
      },
      allowed: true,
    },
  ];

  describe("PUT /organismes/:id/configure-erp - configuration de l'ERP d'un organisme", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.put(`/api/v1/organismes/${id(1)}/configure-erp`, {
        mode_de_transmission: "MANUEL",
        setup_step_courante: "COMPLETE",
      });

      expectUnauthorizedError(response);
    });

    testPermissions(configurationERP, async (organisation, allowed) => {
      const response = await requestAsOrganisation(organisation, "put", `/api/v1/organismes/${id(1)}/configure-erp`, {
        mode_de_transmission: "MANUEL",
        setup_step_courante: "COMPLETE",
      });

      if (allowed) {
        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(response.data, {
          message: "success",
        });
      } else {
        expectForbiddenError(response);
      }
    });
  });
});

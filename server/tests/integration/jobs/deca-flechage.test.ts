import { ObjectId } from "bson";
import { addJob } from "job-processor";
import { MongoClient, type WithoutId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import type { IMissionLocaleEffectif } from "shared/models";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  appliquerCible,
  chargerResponsablesFleches,
  flecherContratsDeca,
  rendreContratsDeca,
} from "@/common/actions/deca/deca-flechage.actions";
import { generateOrganismeComputed } from "@/common/actions/organismes/organismes.actions";
import {
  activerDecaOrganisme,
  poserGardeActivationDeca,
  retirerGardeActivationDeca,
} from "@/common/actions/organismes/organismes.admin.actions";
import {
  effectifsDb,
  effectifsDECADb,
  formationsCatalogueDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes";
import { getBALMongodbUri, getDatabase } from "@/common/mongodb";
import { dateMetier, dateMetierExpr, dedupNom, dedupNomExpr } from "@/common/utils/mongoUtils";
import config from "@/config";
import { hydrateDecaRaw, upsertEffectifDeca } from "@/jobs/hydrate/deca/hydrate-deca-raw";
import { decaJobs } from "@/jobs/registry/deca";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { DeepPartial, testDoc } from "@tests/utils/testUtils";

const mockUpdateVoeux = vi.fn();
const apresFlechage = vi.fn();

vi.mock("job-processor", async (importOriginal) => ({
  ...(await importOriginal<typeof import("job-processor")>()),
  addJob: vi.fn(),
}));

vi.mock("@/common/actions/affelnet.actions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/actions/affelnet.actions")>()),
  updateVoeuxAffelnetEffectifDeca: (...args: unknown[]) => mockUpdateVoeux(...args),
}));

vi.mock("@/common/actions/deca/deca-flechage.actions", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/common/actions/deca/deca-flechage.actions")>();
  return {
    ...original,
    flecherContratsDeca: async (...args: Parameters<typeof original.flecherContratsDeca>) => {
      const bilan = await original.flecherContratsDeca(...args);
      await apresFlechage();
      return bilan;
    },
  };
});

vi.mock("@/common/apis/apiAlternance/client", () => ({
  apiAlternanceClient: { geographie: { rechercheCommune: vi.fn() } },
}));

vi.mock("@/common/services/classifier/classifier", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/classifier/classifier")>()),
  scoreEffectifs: vi.fn().mockResolvedValue({ model: "2026-03-16", scores: [0.5] }),
}));

const ML_ID = 609;
const ML_ORGANISATION_ID = new ObjectId();
const DATE_FLECHAGE = new Date("2025-11-20T03:00:00.000Z");

const responsable: IOrganisme = {
  ...createRandomOrganisme(),
  _id: new ObjectId(),
  siret: "13002374000439",
  uai: "0442095L",
  nature: "responsable_formateur",
};

const creerCible = (overrides: Partial<IOrganisme> = {}): IOrganisme => ({
  ...createRandomOrganisme(),
  _id: new ObjectId(),
  siret: "13002374000447",
  uai: "0442096M",
  nature: "formateur",
  ...overrides,
});

const statutApprenti = {
  en_cours: STATUT_APPRENANT.APPRENTI,
  parcours: [{ date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI }],
};

const statutRupturant = {
  en_cours: STATUT_APPRENANT.RUPTURANT,
  parcours: [
    { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
    { date: new Date("2025-12-01"), valeur: STATUT_APPRENANT.RUPTURANT },
  ],
};

const contratIngere = (overrides: Partial<WithoutId<IEffectifDECA>> = {}): WithoutId<IEffectifDECA> => ({
  deca_raw_id: new ObjectId("66d0b1c2e4b0a1b2c3d4e5f6"),
  organisme_id: responsable._id,
  organisme_responsable_id: responsable._id,
  organisme_formateur_id: responsable._id,
  etablissement_formation_siret: "13002374000447",
  id_erp_apprenant: "id-erp-1",
  source: SOURCE_APPRENANT.DECA,
  annee_scolaire: "2025-2026",
  apprenant: {
    nom: "DUPONT",
    prenom: "Jean",
    date_de_naissance: new Date("2005-01-01T00:00:00.000Z"),
    telephone: "0612345678",
    courriel: "jean.dupont@example.com",
    historique_statut: [],
    has_nir: false,
    adresse: { code_postal: "44000", mission_locale_id: ML_ID },
  },
  formation: {
    cfd: "50022137",
    rncp: "RNCP12345",
    periode: [2025, 2027],
    date_entree: new Date("2025-09-01"),
    date_fin: new Date("2027-06-30"),
  },
  contrats: [{ siret: "12345678901234", date_debut: new Date("2025-09-01"), date_fin: new Date("2027-06-30") }],
  validation_errors: [],
  created_at: new Date(),
  updated_at: new Date(),
  transmitted_at: new Date(),
  _computed: { organisme: generateOrganismeComputed(responsable), statut: statutApprenti },
  is_deca_compatible: true,
  ...overrides,
});

const contratRompu = (overrides: Partial<WithoutId<IEffectifDECA>> = {}) =>
  contratIngere({
    contrats: [
      {
        siret: "12345678901234",
        date_debut: new Date("2025-09-01"),
        date_fin: new Date("2027-06-30"),
        date_rupture: new Date("2025-12-01"),
      },
    ],
    _computed: { organisme: generateOrganismeComputed(responsable), statut: statutRupturant },
    ...overrides,
  });

async function insererChezCible(cible: IOrganisme, overrides: Partial<WithoutId<IEffectifDECA>> = {}) {
  const document = {
    ...appliquerCible(contratIngere(overrides), cible),
    fleche: { regle: "lieu_declare" as const, le: DATE_FLECHAGE },
    _id: new ObjectId(),
  };
  await effectifsDECADb().insertOne(document);
  return document;
}

const responsablesFleches = () => new Set([responsable._id.toString()]);

async function insererContrat(document: WithoutId<IEffectifDECA> = contratIngere()) {
  const contrat = { ...document, _id: new ObjectId() };
  await effectifsDECADb().insertOne(contrat);
  return contrat;
}

async function insererDossier(contrat: IEffectifDECA, overrides: DeepPartial<IMissionLocaleEffectif> = {}) {
  const dossier = testDoc<IMissionLocaleEffectif>({
    _id: new ObjectId(),
    mission_locale_id: ML_ORGANISATION_ID,
    effectif_id: contrat._id,
    effectif_snapshot: contrat,
    effectif_snapshot_date: new Date(),
    date_rupture: new Date("2025-12-01"),
    current_status: { value: STATUT_APPRENANT.RUPTURANT, date: new Date("2025-12-01") },
    created_at: new Date("2025-12-05"),
    brevo: { token: null, token_created_at: null },
    computed: { organisme: { ml_beta_activated_at: null, is_allowed_collab: false } },
    ...overrides,
  });
  await missionLocaleEffectifsDb().insertOne(dossier);
  return dossier;
}

async function insererCible(overrides: Partial<IOrganisme> = {}) {
  const cible = creerCible(overrides);
  await organismesDb().insertOne(cible);
  await formationsCatalogueDb().insertOne(
    {
      _id: new ObjectId(),
      cle_ministere_educatif: new ObjectId().toString(),
      published: true,
      etablissement_gestionnaire_siret: responsable.siret,
      etablissement_formateur_siret: cible.siret,
      cfd: "50022137",
      rncp_code: null,
    } as never,
    { bypassDocumentValidation: true }
  );
  return cible;
}

async function insererErp(organisme: IOrganisme, formation = { cfd: "50022137", rncp: "RNCP12345" }) {
  await effectifsDb().insertOne({
    _id: new ObjectId(),
    ...(await createSampleEffectif({
      organisme,
      annee_scolaire: "2025-2026",
      apprenant: { nom: "Dupont", prenom: "JEAN", date_de_naissance: new Date("2004-12-31T23:00:00.000Z") },
      formation,
    })),
  });
}

const chezQui = async (contrat: IEffectifDECA) => (await effectifsDECADb().findOne({ _id: contrat._id }))?.organisme_id;

describe("fléchage des contrats DECA", () => {
  useMongo();

  beforeAll(async () => {
    await createIndexes();
  });

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2025-12-15T10:00:00.000Z"));
    mockUpdateVoeux.mockReset();
    apresFlechage.mockReset();
    await organismesDb().insertOne(responsable);
    await organisationsDb().insertOne({
      _id: ML_ORGANISATION_ID,
      type: "MISSION_LOCALE",
      nom: "MISSION LOCALE DE NANTES",
      created_at: new Date(),
      ml_id: ML_ID,
      email: "",
      telephone: "",
      site_web: "",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    config.deca.flechageAuto = false;
  });

  describe("ré-ingestion d'un contrat chez sa cible", () => {
    it("garde le document chez la cible et met à jour son statut", async () => {
      const cible = creerCible();
      await organismesDb().insertOne(cible);
      const fleche = await insererChezCible(cible);

      const resultat = await upsertEffectifDeca(contratRompu(), responsablesFleches());

      expect(resultat).toEqual({ created: false });
      const documents = await effectifsDECADb().find({}).toArray();
      expect(documents).toHaveLength(1);
      expect(documents[0]).toMatchObject({
        _id: fleche._id,
        organisme_id: cible._id,
        organisme_responsable_id: responsable._id,
        organisme_formateur_id: cible._id,
        is_deca_compatible: true,
        fleche: { regle: "lieu_declare", le: DATE_FLECHAGE },
        _computed: {
          organisme: { siret: cible.siret, uai: cible.uai },
          statut: { en_cours: STATUT_APPRENANT.RUPTURANT },
        },
      });
    });

    it("crée chez la cible le dossier ML d'une rupture arrivée après le fléchage", async () => {
      const cible = creerCible();
      await organismesDb().insertOne(cible);
      const fleche = await insererChezCible(cible);

      await upsertEffectifDeca(contratRompu(), responsablesFleches());

      const dossier = await missionLocaleEffectifsDb().findOne({ effectif_id: fleche._id });
      expect(dossier?.effectif_snapshot).toMatchObject({
        organisme_id: cible._id,
        _computed: { organisme: { siret: cible.siret, uai: cible.uai } },
        fleche: { regle: "lieu_declare" },
      });
    });

    it("crée chez la cible une nouvelle année du même contrat", async () => {
      const cible = creerCible();
      await organismesDb().insertOne(cible);
      await insererChezCible(cible);

      const resultat = await upsertEffectifDeca(contratIngere({ annee_scolaire: "2026-2027" }), responsablesFleches());

      expect(resultat).toEqual({ created: true });
      const nouvelleAnnee = await effectifsDECADb().findOne({ annee_scolaire: "2026-2027" });
      expect(nouvelleAnnee).toMatchObject({
        organisme_id: cible._id,
        organisme_responsable_id: responsable._id,
        organisme_formateur_id: cible._id,
        is_deca_compatible: true,
        fleche: { regle: "lieu_declare", le: DATE_FLECHAGE },
        _computed: { organisme: { siret: cible.siret } },
      });
      expect(await effectifsDECADb().countDocuments({ organisme_id: responsable._id })).toBe(0);
      expect(mockUpdateVoeux).toHaveBeenCalledWith(
        nouvelleAnnee?._id,
        expect.objectContaining({ organisme_formateur_id: cible._id }),
        cible._id.toString()
      );
    });

    it("met à jour chez le responsable l'année qu'il porte déjà, sans la recréer chez la cible", async () => {
      const cible = creerCible();
      await organismesDb().insertOne(cible);
      await insererChezCible(cible);
      const autreContrat = await insererContrat(
        contratIngere({ annee_scolaire: "2026-2027", deca_raw_id: new ObjectId() })
      );

      const resultat = await upsertEffectifDeca(contratIngere({ annee_scolaire: "2026-2027" }), responsablesFleches());

      expect(resultat).toEqual({ created: false });
      const annee = await effectifsDECADb().find({ annee_scolaire: "2026-2027" }).toArray();
      expect(annee).toHaveLength(1);
      expect(annee[0]).toMatchObject({ _id: autreContrat._id, organisme_id: responsable._id });
      expect(annee[0]).not.toHaveProperty("fleche");
    });

    it("met à jour le document chez la cible quand le CFD change, sans doublon chez le responsable", async () => {
      const cible = creerCible();
      await organismesDb().insertOne(cible);
      await insererChezCible(cible);

      await upsertEffectifDeca(
        contratIngere({ formation: { ...contratIngere().formation, cfd: "40022106" } }),
        responsablesFleches()
      );

      const documents = await effectifsDECADb().find({}).toArray();
      expect(documents).toHaveLength(1);
      expect(documents[0]).toMatchObject({ organisme_id: cible._id, formation: { cfd: "40022106" } });
    });

    it("chez une cible qui transmet par ERP, passe le document hors union ML batch et crée quand même son dossier", async () => {
      const cible = creerCible({ is_transmission_target: true });
      await organismesDb().insertOne(cible);
      const fleche = await insererChezCible(cible);

      await upsertEffectifDeca(contratRompu(), responsablesFleches());

      const document = await effectifsDECADb().findOne({ _id: fleche._id });
      expect(document?.is_deca_compatible).toBe(false);
      expect(await missionLocaleEffectifsDb().countDocuments({ effectif_id: fleche._id })).toBe(1);
    });

    it("suit le chemin actuel pour un responsable sans document fléché", async () => {
      const cible = creerCible();
      await organismesDb().insertOne(cible);
      const fleche = await insererChezCible(cible);

      await upsertEffectifDeca(contratRompu(), new Set());

      expect(await effectifsDECADb().countDocuments({ organisme_id: responsable._id })).toBe(1);
      expect(await effectifsDECADb().findOne({ _id: fleche._id })).toMatchObject({
        _computed: { statut: { en_cours: STATUT_APPRENANT.APPRENTI } },
      });
    });

    it("crée chez le responsable la nouvelle année d'un contrat annulé", async () => {
      const annule = {
        ...contratIngere(),
        fleche: { regle: "lieu_declare" as const, le: DATE_FLECHAGE, annule_le: new Date("2025-12-01") },
        _id: new ObjectId(),
      };
      await effectifsDECADb().insertOne(annule);

      await upsertEffectifDeca(contratIngere({ annee_scolaire: "2026-2027" }), responsablesFleches());

      const nouvelleAnnee = await effectifsDECADb().findOne({ annee_scolaire: "2026-2027" });
      expect(nouvelleAnnee?.organisme_id).toEqual(responsable._id);
      expect(nouvelleAnnee).not.toHaveProperty("fleche");
    });

    it("ne charge que les responsables qui ont un document chez sa cible", async () => {
      const cible = creerCible();
      const autreResponsableId = new ObjectId();
      await insererChezCible(cible);
      await effectifsDECADb().insertOne({
        ...contratIngere({ organisme_id: autreResponsableId, organisme_responsable_id: autreResponsableId }),
        fleche: { regle: "erp_formateur", le: DATE_FLECHAGE, annule_le: new Date("2025-12-01") },
        _id: new ObjectId(),
      });

      expect(await chargerResponsablesFleches()).toEqual(new Set([responsable._id.toString()]));
    });
  });

  describe("job deca:flechage", () => {
    beforeEach(async () => {
      await organismesDb().updateOne({ _id: responsable._id }, { $set: { is_allowed_deca: true } });
    });

    it("calcule en JS les mêmes clés d'identité que les expressions Mongo de la dédup", async () => {
      const valeurs = [
        { nom: "ROUSSEAU--CHAUVET", prenom: "Léa", ddn: new Date("2008-08-07T22:00:00.000Z") },
        { nom: "  Louet - Le Cam ", prenom: "Jean-François", ddn: new Date("2008-01-14T23:00:00.000Z") },
        { nom: "D’ARC", prenom: "ÉLODIE", ddn: new Date("2008-03-10T00:00:00.000Z") },
        { nom: "Núñez García", prenom: "Zoë", ddn: new Date("2008-03-10T21:59:00.000Z") },
        { nom: null, prenom: "O'Neil", ddn: null },
      ];

      const resultats = await getDatabase()
        .aggregate([
          { $documents: valeurs },
          {
            $project: {
              nom: dedupNomExpr("$nom"),
              prenom: dedupNomExpr("$prenom"),
              ddn: { $dateToString: { date: dateMetierExpr("$ddn"), format: "%Y-%m-%d" } },
            },
          },
        ])
        .toArray();

      expect(resultats.map(({ nom, prenom, ddn }) => ({ nom, prenom, ddn: ddn ?? null }))).toEqual(
        valeurs.map(({ nom, prenom, ddn }) => ({
          nom: dedupNom(nom),
          prenom: dedupNom(prenom),
          ddn: dateMetier(ddn),
        }))
      );
    });

    describe("cas qui bougent", () => {
      it("flèche vers le lieu déclaré activé DECA, avec tous ses dossiers ML", async () => {
        const cible = await insererCible({ is_allowed_deca: true });
        const contrat = await insererContrat(contratRompu());
        const dossier = await insererDossier(contrat);
        const supprime = await insererDossier(contrat, { mission_locale_id: new ObjectId(), soft_deleted: true });

        const bilan = await flecherContratsDeca();

        expect(bilan.fleches).toEqual({ lieu_declare: 1, erp_formateur: 0 });
        expect(await effectifsDECADb().findOne({ _id: contrat._id })).toMatchObject({
          organisme_id: cible._id,
          organisme_responsable_id: responsable._id,
          organisme_formateur_id: cible._id,
          fleche: { regle: "lieu_declare", le: new Date("2025-12-15T10:00:00.000Z") },
          _computed: { organisme: { siret: cible.siret, uai: cible.uai } },
        });
        for (const { _id } of [dossier, supprime]) {
          expect(await missionLocaleEffectifsDb().findOne({ _id })).toMatchObject({
            effectif_snapshot: {
              organisme_id: cible._id,
              _computed: { organisme: { siret: cible.siret } },
              fleche: { regle: "lieu_declare" },
            },
          });
        }
        expect(bilan.parCfa.get(responsable._id.toString())).toMatchObject({ perdus: 1, dossiersMlPerdus: 1 });
        expect(bilan.parCfa.get(cible._id.toString())).toMatchObject({ gagnes: 1, dossiersMlGagnes: 1 });
      });

      it("flèche vers le seul formateur lié qui a le jeune dans son ERP", async () => {
        const formateur = await insererCible({ siret: "19440001400017", uai: "0442097N", is_allowed_deca: true });
        await organismesDb().updateOne(
          { _id: responsable._id },
          { $set: { organismesFormateurs: [{ _id: formateur._id, siret: formateur.siret }] } }
        );
        await insererErp(formateur);
        const contrat = await insererContrat(contratIngere({ etablissement_formation_siret: null }));

        const bilan = await flecherContratsDeca();

        expect(bilan.fleches).toEqual({ lieu_declare: 0, erp_formateur: 1 });
        expect(await effectifsDECADb().findOne({ _id: contrat._id })).toMatchObject({
          organisme_id: formateur._id,
          fleche: { regle: "erp_formateur" },
        });
      });

      it("déplace tout le groupe d'un contrat sur deux années", async () => {
        const cible = await insererCible({ is_allowed_deca: true });
        const premiere = await insererContrat(contratRompu());
        const seconde = await insererContrat(contratIngere({ annee_scolaire: "2026-2027" }));
        const dossier = await insererDossier(premiere);

        const bilan = await flecherContratsDeca();

        expect(bilan.fleches.lieu_declare).toBe(1);
        expect(await chezQui(premiere)).toEqual(cible._id);
        expect(await chezQui(seconde)).toEqual(cible._id);
        expect(
          (await missionLocaleEffectifsDb().findOne({ _id: dossier._id }))?.effectif_snapshot.organisme_id
        ).toEqual(cible._id);
      });

      it("fait basculer le groupe d'une cible retenue quand elle est activée DECA", async () => {
        const cible = await insererCible();
        const contrat = await insererContrat();

        const avant = await flecherContratsDeca();
        const activation = await flecherContratsDeca({ perimetre: [cible._id], flagsSimules: [cible._id] });

        expect(avant.retenus).toBe(1);
        expect(activation.fleches.lieu_declare).toBe(1);
        expect(await chezQui(contrat)).toEqual(cible._id);
      });
    });

    describe("cas qui ne bougent pas", () => {
      it("garde chez le responsable le contrat d'une cible avec compte mais sans flag DECA", async () => {
        const cible = await insererCible();
        const organisationId = new ObjectId();
        await organisationsDb().insertOne({
          _id: organisationId,
          type: "ORGANISME_FORMATION",
          siret: cible.siret,
          uai: cible.uai ?? null,
          organisme_id: cible._id.toString(),
          created_at: new Date(),
        });
        await usersMigrationDb().insertOne(
          {
            _id: new ObjectId(),
            email: "admin@cible.fr",
            password: "hash",
            nom: "ADMIN",
            prenom: "Cible",
            organisation_id: organisationId,
            account_status: "CONFIRMED",
            created_at: new Date(),
          } as never,
          { bypassDocumentValidation: true }
        );
        const contrat = await insererContrat();

        const bilan = await flecherContratsDeca();

        expect(bilan.retenus).toBe(1);
        expect(bilan.retenusParSite.get(`${responsable._id.toString()}>${cible._id.toString()}`)).toBe(1);
        expect(await effectifsDECADb().findOne({ _id: contrat._id })).toEqual(contrat);
      });

      it("traite à part deux contrats d'une même personne vers deux lieux", async () => {
        const premiereCible = await insererCible({ is_allowed_deca: true });
        const secondeCible = await insererCible({ siret: "13002374000454", uai: "0442098P", is_allowed_deca: true });
        const premier = await insererContrat(contratIngere({ annee_scolaire: "2025-2025" }));
        const second = await insererContrat(
          contratIngere({ deca_raw_id: new ObjectId(), etablissement_formation_siret: secondeCible.siret })
        );

        await flecherContratsDeca();

        expect(await chezQui(premier)).toEqual(premiereCible._id);
        expect(await chezQui(second)).toEqual(secondeCible._id);
      });

      it("ne flèche pas un jeune présent dans l'ERP d'un autre organisme pour la même formation", async () => {
        await insererCible({ is_allowed_deca: true });
        await insererErp({ ...creerCible(), siret: "19440001400017", uai: "0442097N" });
        const contrat = await insererContrat();

        const bilan = await flecherContratsDeca();

        expect(bilan.fleches).toEqual({ lieu_declare: 0, erp_formateur: 0 });
        expect(await chezQui(contrat)).toEqual(responsable._id);
      });

      it("ne flèche pas un jeune présent dans l'ERP du responsable, même si un formateur l'a aussi", async () => {
        const cible = await insererCible({ is_allowed_deca: true });
        await insererErp(responsable);
        await insererErp(cible);
        const contrat = await insererContrat();

        const bilan = await flecherContratsDeca();

        expect(bilan.erpResponsable).toBe(1);
        expect(await chezQui(contrat)).toEqual(responsable._id);
      });

      it("ne flèche pas vers une cible sans UAI", async () => {
        await insererCible({ uai: null, is_allowed_deca: true });
        const contrat = await insererContrat();

        const bilan = await flecherContratsDeca();

        expect(bilan.ciblesSansUai).toBe(1);
        expect(await chezQui(contrat)).toEqual(responsable._id);
      });

      it("compte dans les cibles sans UAI le seul formateur lié qui a le jeune dans son ERP", async () => {
        const formateur = await insererCible({ siret: "19440001400017", uai: null, is_allowed_deca: true });
        await organismesDb().updateOne(
          { _id: responsable._id },
          { $set: { organismesFormateurs: [{ _id: formateur._id, siret: formateur.siret }] } }
        );
        await insererErp(formateur);
        const contrat = await insererContrat(contratIngere({ etablissement_formation_siret: null }));

        const bilan = await flecherContratsDeca();

        expect(bilan.ciblesSansUai).toBe(1);
        expect(await chezQui(contrat)).toEqual(responsable._id);
      });

      it("ne flèche pas vers un responsable pur", async () => {
        await insererCible({ nature: "responsable", is_allowed_deca: true });
        const contrat = await insererContrat();

        await flecherContratsDeca();

        expect(await chezQui(contrat)).toEqual(responsable._id);
      });

      it("ignore les contrats dont ni le responsable ni le lieu ne sont activés DECA", async () => {
        await organismesDb().updateOne({ _id: responsable._id }, { $set: { is_allowed_deca: false } });
        await insererCible();
        await insererContrat();

        const bilan = await flecherContratsDeca();

        expect(bilan.groupes).toBe(0);
      });

      it("gèle tout le groupe quand le CFA a agi sur le dossier de l'autre année", async () => {
        await insererCible({ is_allowed_deca: true });
        const premiere = await insererContrat();
        const seconde = await insererContrat(contratRompu({ annee_scolaire: "2026-2027" }));
        await insererDossier(seconde, { organisme_data: { acc_conjoint: true } });

        const bilan = await flecherContratsDeca();

        expect(bilan.gels).toBe(1);
        expect(await chezQui(premiere)).toEqual(responsable._id);
        expect(await chezQui(seconde)).toEqual(responsable._id);
      });

      it("journalise un conflit quand la cible a déjà ce jeune la même année", async () => {
        const cible = await insererCible({ is_allowed_deca: true });
        await insererContrat(
          contratIngere({
            deca_raw_id: new ObjectId(),
            organisme_id: cible._id,
            organisme_responsable_id: cible._id,
            organisme_formateur_id: cible._id,
          })
        );
        const contrat = await insererContrat();

        const bilan = await flecherContratsDeca();

        expect(bilan.conflits).toBe(1);
        expect(await chezQui(contrat)).toEqual(responsable._id);
      });
    });

    describe("robustesse", () => {
      it("refuse --simuler-flag sans --dry-run", async () => {
        const cible = await insererCible();
        const contrat = await insererContrat();

        await expect(
          decaJobs["deca:flechage"].handler({ payload: { simulerFlag: [cible.siret] } } as never)
        ).rejects.toThrow("--simuler-flag ne s'utilise qu'avec --dry-run");
        expect(await chezQui(contrat)).toEqual(responsable._id);
      });

      it("donne le même résultat au second passage", async () => {
        await insererCible({ is_allowed_deca: true });
        const contrat = await insererContrat(contratRompu());
        await insererDossier(contrat);

        await flecherContratsDeca();
        const apresPremier = await effectifsDECADb().find({}).toArray();
        const second = await flecherContratsDeca();

        expect(second.fleches).toEqual({ lieu_declare: 0, erp_formateur: 0 });
        expect(second.dossiersMlRepares).toBe(0);
        expect(await effectifsDECADb().find({}).toArray()).toEqual(apresPremier);
      });

      it("répare le dossier ML d'un contrat fléché resté sur le responsable", async () => {
        const cible = await insererCible({ is_allowed_deca: true });
        const contrat = await insererChezCible(cible);
        const dossier = await insererDossier({ ...contrat, organisme_id: responsable._id });

        const bilan = await flecherContratsDeca();

        expect(bilan.dossiersMlRepares).toBe(1);
        expect(
          (await missionLocaleEffectifsDb().findOne({ _id: dossier._id }))?.effectif_snapshot.organisme_id
        ).toEqual(cible._id);
      });

      it("compte les dossiers ML qui deviendraient invisibles de la Mission Locale", async () => {
        const cible = await insererCible({ is_allowed_deca: true });
        await organisationsDb().insertOne({
          _id: new ObjectId(),
          type: "ORGANISME_FORMATION",
          siret: cible.siret,
          uai: cible.uai ?? null,
          organisme_id: cible._id.toString(),
          ml_beta_activated_at: new Date("2025-10-01"),
          created_at: new Date(),
        });
        const contrat = await insererContrat(contratRompu());
        const dossier = await insererDossier(contrat);

        const bilan = await flecherContratsDeca({ dryRun: true });

        expect(bilan.dossiersMlInvisibles).toEqual([
          { dossierId: dossier._id, missionLocaleId: ML_ORGANISATION_ID, cibleId: cible._id },
        ]);
        expect(await chezQui(contrat)).toEqual(responsable._id);
      });
    });

    describe("activation et fin d'import", () => {
      async function cibleActivable() {
        const cible = await insererCible({ ferme: false });
        await effectifsDb().insertOne({
          _id: new ObjectId(),
          ...(await createSampleEffectif({ organisme: cible, annee_scolaire: "2025-2026" })),
        });
        await poserGardeActivationDeca(cible._id);
        return cible;
      }

      it("flèche vers l'organisme activé les contrats dont il est le lieu, puis pose son flag", async () => {
        const cible = await cibleActivable();
        const contrat = await insererContrat();

        const resultat = await activerDecaOrganisme(cible._id, { flecher: true });

        expect(resultat).toBe("flag_pose");
        expect(await chezQui(contrat)).toEqual(cible._id);
        expect((await organismesDb().findOne({ _id: cible._id }))?.is_allowed_deca).toBe(true);
      });

      it("rend ses contrats au responsable quand une désactivation annule l'activation pendant le fléchage", async () => {
        const cible = await cibleActivable();
        const contrat = await insererContrat();
        apresFlechage.mockImplementationOnce(() => retirerGardeActivationDeca(cible._id));

        const resultat = await activerDecaOrganisme(cible._id, { flecher: true });

        expect(resultat).toBe("annule");
        expect(await chezQui(contrat)).toEqual(responsable._id);
        expect(await effectifsDECADb().findOne({ _id: contrat._id })).not.toHaveProperty("fleche");
        expect((await organismesDb().findOne({ _id: cible._id }))?.is_allowed_deca).toBeUndefined();
      });

      it("rend ses contrats au responsable quand le fléchage échoue", async () => {
        const cible = await cibleActivable();
        const contrat = await insererContrat();
        apresFlechage.mockRejectedValueOnce(new Error("panne"));

        await expect(activerDecaOrganisme(cible._id, { flecher: true })).rejects.toThrow("panne");

        expect(await chezQui(contrat)).toEqual(responsable._id);
        expect((await organismesDb().findOne({ _id: cible._id }))?.is_allowed_deca).toBeUndefined();
      });

      it("active sans effectifs un organisme dont la branche a été forcée", async () => {
        const cible = await insererCible({ ferme: false });
        await poserGardeActivationDeca(cible._id);

        expect(await activerDecaOrganisme(cible._id, { flecher: false })).toBe("non_eligible");
        expect(await activerDecaOrganisme(cible._id, { flecher: false, ignorerEffectifs: true })).toBe("flag_pose");
      });

      it("pose le flag sans flécher quand l'interrupteur est coupé", async () => {
        const cible = await cibleActivable();
        const contrat = await insererContrat();

        expect(await activerDecaOrganisme(cible._id, { flecher: false })).toBe("flag_pose");
        expect(await chezQui(contrat)).toEqual(responsable._id);
      });

      describe("fin de l'import DECA", () => {
        const bal = new MongoClient(getBALMongodbUri(config.mongodb.dbNameBal));
        const contratBrutId = new ObjectId();

        beforeEach(async () => {
          vi.mocked(addJob).mockReset();
          await bal.connect();
          await bal
            .db()
            .collection(config.mongodb.decaDbCollectionBal)
            .insertOne({
              _id: contratBrutId,
              dispositif: "APPR",
              organisme_formation: { uai_cfa: "0000000A", siret: "00000000000000" },
              formation: { date_debut_formation: "2025-09-01", date_fin_formation: "2026-06-30" },
            });
        });

        afterEach(async () => {
          await bal.db().collection(config.mongodb.decaDbCollectionBal).deleteOne({ _id: contratBrutId });
          await bal.close();
        });

        it("met le fléchage en file après un import complet quand l'interrupteur est allumé", async () => {
          config.deca.flechageAuto = true;

          await hydrateDecaRaw();

          expect(addJob).toHaveBeenCalledWith({ name: "deca:flechage", payload: {}, queued: true });
        });

        it("ne met rien en file interrupteur coupé, ni après un import limité", async () => {
          await hydrateDecaRaw();
          config.deca.flechageAuto = true;
          await hydrateDecaRaw({ limit: 1 });

          expect(addJob).not.toHaveBeenCalled();
        });
      });
    });

    describe("annulation", () => {
      it("--annuler rend durablement le groupe au responsable", async () => {
        await insererCible({ is_allowed_deca: true });
        const contrat = await insererContrat(contratRompu());
        const dossier = await insererDossier(contrat);
        await flecherContratsDeca();

        await rendreContratsDeca({ mode: "annuler", responsables: [responsable._id] });
        const bilan = await flecherContratsDeca();

        expect(bilan.exclusParAnnulation).toBe(1);
        expect(await effectifsDECADb().findOne({ _id: contrat._id })).toMatchObject({
          organisme_id: responsable._id,
          organisme_formateur_id: responsable._id,
          fleche: { regle: "lieu_declare", annule_le: new Date("2025-12-15T10:00:00.000Z") },
          _computed: { organisme: { siret: responsable.siret } },
        });
        expect(await missionLocaleEffectifsDb().findOne({ _id: dossier._id })).toMatchObject({
          effectif_snapshot: { organisme_id: responsable._id, fleche: { annule_le: expect.any(Date) } },
        });
      });

      it("--annuler puis une nouvelle année du même contrat : elle reste chez le responsable", async () => {
        await insererCible({ is_allowed_deca: true });
        await insererContrat();
        await flecherContratsDeca();
        await rendreContratsDeca({ mode: "annuler", responsables: [responsable._id] });

        await upsertEffectifDeca(contratIngere({ annee_scolaire: "2026-2027" }), await chargerResponsablesFleches());
        await flecherContratsDeca();

        expect((await effectifsDECADb().findOne({ annee_scolaire: "2026-2027" }))?.organisme_id).toEqual(
          responsable._id
        );
      });

      it("--refaire rend le groupe au responsable et le job le redéplace", async () => {
        const cible = await insererCible({ is_allowed_deca: true });
        const contrat = await insererContrat(contratRompu());
        const dossier = await insererDossier(contrat);
        await flecherContratsDeca();

        await rendreContratsDeca({ mode: "refaire", responsables: [responsable._id] });
        const rendu = await effectifsDECADb().findOne({ _id: contrat._id });
        const dossierRendu = await missionLocaleEffectifsDb().findOne({ _id: dossier._id });
        await flecherContratsDeca();

        expect(rendu?.organisme_id).toEqual(responsable._id);
        expect(rendu).not.toHaveProperty("fleche");
        expect(dossierRendu?.effectif_snapshot).not.toHaveProperty("fleche");
        expect(await chezQui(contrat)).toEqual(cible._id);
      });

      it("cible désactivée puis --refaire --cible : ses groupes reviennent chez leur responsable et y restent", async () => {
        const cible = await insererCible({ is_allowed_deca: true });
        const contrat = await insererContrat();
        await flecherContratsDeca();
        await organismesDb().updateOne({ _id: cible._id }, { $set: { is_allowed_deca: false } });

        await rendreContratsDeca({ mode: "refaire", cibles: [cible._id] });
        const bilan = await flecherContratsDeca();

        expect(bilan.retenus).toBe(1);
        expect(await chezQui(contrat)).toEqual(responsable._id);
      });

      it("--refaire --cible sur un responsable ne lève pas l'annulation de ses propres contrats", async () => {
        await insererCible({ is_allowed_deca: true });
        const contrat = await insererContrat();
        await flecherContratsDeca();
        await rendreContratsDeca({ mode: "annuler", responsables: [responsable._id] });

        await rendreContratsDeca({ mode: "refaire", cibles: [responsable._id] });
        const bilan = await flecherContratsDeca();

        expect(bilan.exclusParAnnulation).toBe(1);
        expect(await effectifsDECADb().findOne({ _id: contrat._id })).toMatchObject({
          organisme_id: responsable._id,
          fleche: { annule_le: expect.any(Date) },
        });
      });

      it("--refaire sans portée laisse chez sa cible un groupe en conflit chez le responsable", async () => {
        const cible = await insererCible({ is_allowed_deca: true });
        const contrat = await insererContrat();
        await flecherContratsDeca();
        await insererContrat(contratIngere({ deca_raw_id: new ObjectId() }));

        const bilan = await rendreContratsDeca({ mode: "refaire" });

        expect(bilan.conflits).toHaveLength(1);
        expect(await effectifsDECADb().findOne({ _id: contrat._id })).toMatchObject({
          organisme_id: cible._id,
          fleche: { regle: "lieu_declare" },
        });
      });

      it("--annuler garde chez la cible un groupe dont le CFA a agi depuis le fléchage", async () => {
        const cible = await insererCible({ is_allowed_deca: true });
        const contrat = await insererContrat(contratRompu());
        const dossier = await insererDossier(contrat);
        await flecherContratsDeca();
        await missionLocaleEffectifsDb().updateOne(
          { _id: dossier._id },
          {
            $set: {
              "organisme_data.acc_conjoint": true,
              "organisme_data.reponse_at": new Date("2025-12-16T09:00:00.000Z"),
            },
          }
        );

        const bilan = await rendreContratsDeca({ mode: "annuler", responsables: [responsable._id] });

        expect(bilan.gels).toBe(1);
        expect(await chezQui(contrat)).toEqual(cible._id);
      });
    });
  });
});

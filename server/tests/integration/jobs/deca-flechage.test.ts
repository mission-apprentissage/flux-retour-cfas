import { ObjectId } from "bson";
import type { WithoutId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { appliquerCible, chargerResponsablesFleches } from "@/common/actions/deca/deca-flechage.actions";
import { generateOrganismeComputed } from "@/common/actions/organismes/organismes.actions";
import { effectifsDECADb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes";
import { upsertEffectifDeca } from "@/jobs/hydrate/deca/hydrate-deca-raw";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

const mockUpdateVoeux = vi.fn();

vi.mock("@/common/actions/affelnet.actions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/actions/affelnet.actions")>()),
  updateVoeuxAffelnetEffectifDeca: (...args: unknown[]) => mockUpdateVoeux(...args),
}));

vi.mock("@/common/apis/apiAlternance/client", () => ({
  apiAlternanceClient: { geographie: { rechercheCommune: vi.fn() } },
}));

vi.mock("@/common/services/classifier/classifier", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/classifier/classifier")>()),
  scoreEffectifs: vi.fn().mockResolvedValue({ model: "2026-03-16", scores: [0.5] }),
}));

const ML_ID = 609;
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

describe("fléchage des contrats DECA", () => {
  useMongo();

  beforeAll(async () => {
    await createIndexes();
  });

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2025-12-15T10:00:00.000Z"));
    mockUpdateVoeux.mockReset();
    await organismesDb().insertOne(responsable);
    await organisationsDb().insertOne({
      _id: new ObjectId(),
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
});

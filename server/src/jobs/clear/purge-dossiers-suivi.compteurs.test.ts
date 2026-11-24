import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import type { IMissionLocaleEffectif, IOrganisationMissionLocale } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";
import missionLocaleStatsPurgesDescriptor from "shared/models/data/missionLocaleStatsPurges.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { normalizeToUTCDay } from "shared/utils/date";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMissionLocaleDetail } from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { getMissionLocaleFicheIndicateurs } from "@/common/actions/mission-locale/mission-locale-fiche.actions";
import {
  createMissionLocaleStatsIfMissing,
  createOrUpdateMissionLocaleStats,
  getSuiviTraitementByRegion,
  getTraitementExportData,
  getTraitementStatsByMissionLocale,
  setMissionLocaleStatsFields,
} from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { getMissionLocaleStat } from "@/common/actions/mission-locale/mission-locale.actions";
import {
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  missionLocaleEffectifsPurgesStatsDb,
  missionLocaleStatsDb,
  missionLocaleStatsPurgesDb,
  organisationsDb,
} from "@/common/model/collections";
import { createCollectionIndexes } from "@/common/model/indexes/createCollectionIndexes";
import { useMongo } from "@tests/jest/setupMongo";

import * as compteurs from "./compteurs-dossiers-ml";
import { purgerDossiersSuivi } from "./purge-dossiers-suivi";

vi.mock("./compteurs-dossiers-ml", async (importOriginal) => {
  const original = await importOriginal<typeof import("./compteurs-dossiers-ml")>();
  return {
    ...original,
    calculerContributions: vi.fn(original.calculerContributions),
    ecrireContributions: vi.fn(original.ecrireContributions),
  };
});

useMongo();

const maintenant = new Date("2027-09-01T00:00:00Z");
const date = (iso: string) => new Date(`${iso}T00:00:00Z`);

const ML_ID = new ObjectId();
const ML_ORGANISATION = {
  _id: ML_ID,
  type: "MISSION_LOCALE",
  ml_id: 4242,
  nom: "ML Test",
  created_at: date("2025-01-01"),
  activated_at: date("2025-03-01"),
  adresse: { region: "84", departement: "01" },
} as IOrganisationMissionLocale;

type Options = {
  rupture?: string;
  anneeScolaire?: string;
  situation?: SITUATION_ENUM | null;
  softDeleted?: boolean;
  age?: number;
  dejaConnu?: boolean;
};

const dossier = ({
  rupture = "2025-03-01",
  anneeScolaire = "2024-2025",
  situation = null,
  softDeleted = false,
  age = 20,
  dejaConnu = false,
}: Options = {}) => ({
  _id: new ObjectId(),
  mission_locale_id: ML_ID,
  effectif_id: new ObjectId(),
  created_at: date(rupture),
  date_rupture: date(rupture),
  current_status: { value: STATUT_APPRENANT.RUPTURANT, date: date(rupture) },
  situation,
  ...(softDeleted ? { soft_deleted: true } : {}),
  ...(dejaConnu ? { deja_connu: true } : {}),
  effectif_snapshot: {
    _id: new ObjectId(),
    organisme_id: new ObjectId(),
    source: SOURCE_APPRENANT.ERP,
    annee_scolaire: anneeScolaire,
    apprenant: {
      nom: "DOE",
      prenom: "John",
      date_de_naissance: new Date(new Date().setFullYear(new Date().getFullYear() - age)),
    },
    formation: {},
    _computed: { statut: { en_cours: STATUT_APPRENANT.RUPTURANT } },
  },
});

const inserer = async (dossiers: ReturnType<typeof dossier>[]) => {
  await missionLocaleEffectifsDb().insertMany(dossiers as unknown as IMissionLocaleEffectif[], {
    bypassDocumentValidation: true,
  });
};

const photoDuJour = async () => {
  await createOrUpdateMissionLocaleStats(ML_ID);
  const photo = await missionLocaleStatsDb().findOne({
    mission_locale_id: ML_ID,
    computed_day: normalizeToUTCDay(new Date()),
  });
  if (!photo?.segments) throw new Error("photo absente");
  return { stats: photo.stats, segments: photo.segments };
};

const jeu = () => {
  const vivant = dossier({ rupture: "2026-09-01", anneeScolaire: "2026-2027", situation: SITUATION_ENUM.RDV_PRIS });
  const traite = dossier({ situation: SITUATION_ENUM.RDV_PRIS });
  const jamaisTraite = dossier();
  const aRecontacter = dossier({ situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR });
  const masque = dossier({ softDeleted: true, situation: SITUATION_ENUM.RDV_PRIS });
  return { vivant, traite, jamaisTraite, aRecontacter, masque };
};

describe("compteurs des photos ML à la purge des dossiers de suivi", () => {
  beforeEach(async () => {
    await organisationsDb().insertOne(ML_ORGANISATION as IOrganisation, { bypassDocumentValidation: true });
    await createCollectionIndexes(missionLocaleStatsPurgesDescriptor);
  });

  it("garde les cumuls de la photo du jour et retire les purgés des stocks", async () => {
    const { vivant, traite, jamaisTraite, aRecontacter, masque } = jeu();
    await inserer([vivant, traite, jamaisTraite, aRecontacter, masque]);
    const avant = await photoDuJour();

    const resultat = await purgerDossiersSuivi({ maintenant });
    const apres = await photoDuJour();

    expect(resultat.missionLocale).toMatchObject({ supprimes: 4, comptes: 3 });
    expect(await missionLocaleEffectifsDb().countDocuments()).toBe(1);
    expect(avant.stats).toMatchObject({ total: 4, a_traiter: 1, traite: 3, contacte_sans_retour: 1 });
    expect(apres.stats).toStrictEqual({ ...avant.stats, a_traiter: 0, contacte_sans_retour: 0 });
    expect(apres.segments).toStrictEqual({
      rupture: { ...avant.segments.rupture, a_traiter: 0, a_recontacter: 0 },
      collab: avant.segments.collab,
    });
  });

  it("garde dans les compteurs autant de dossiers que la photo en perd", async () => {
    const { vivant, traite, jamaisTraite, aRecontacter } = jeu();
    await inserer([vivant, traite, jamaisTraite, aRecontacter]);

    const resultat = await purgerDossiersSuivi({ maintenant });

    const purges = await missionLocaleStatsPurgesDb().findOne({ mission_locale_id: ML_ID });
    expect(purges?.stats).toMatchObject({ total: 3, a_traiter: 1, traite: 2, rdv_pris: 1, contacte_sans_retour: 1 });
    expect(purges?.segments.rupture).toMatchObject({ total: 3, a_recontacter: 1 });
    expect(resultat.missionLocale.comptes).toBe(3);
  });

  it("additionne les purges successives", async () => {
    await inserer([dossier({ situation: SITUATION_ENUM.RDV_PRIS })]);
    await purgerDossiersSuivi({ maintenant });
    await inserer([dossier({ situation: SITUATION_ENUM.RDV_PRIS })]);
    await purgerDossiersSuivi({ maintenant });

    const purges = await missionLocaleStatsPurgesDb().find({}).toArray();
    expect(purges).toHaveLength(1);
    expect(purges[0].stats).toMatchObject({ total: 2, traite: 2, rdv_pris: 2 });
  });

  it("n'écrit aucun compteur en simulation", async () => {
    const { traite, jamaisTraite, masque } = jeu();
    await inserer([traite, jamaisTraite, masque]);

    const resultat = await purgerDossiersSuivi({ maintenant, dryRun: true });

    expect(resultat.missionLocale).toMatchObject({ supprimes: 3, comptes: 2 });
    expect(await missionLocaleStatsPurgesDb().countDocuments()).toBe(0);
  });

  it("lève l'alerte à recontacter quand les dossiers purgés la portaient", async () => {
    await inserer(Array.from({ length: 31 }, () => dossier({ situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR })));
    await createOrUpdateMissionLocaleStats(ML_ID);
    const avant = await getMissionLocaleFicheIndicateurs(ML_ID);

    await purgerDossiersSuivi({ maintenant });
    await createOrUpdateMissionLocaleStats(ML_ID);
    const apres = await getMissionLocaleFicheIndicateurs(ML_ID);

    expect(avant.alertes.map(({ type }) => type)).toContain("a_recontacter");
    expect(apres.alertes.map(({ type }) => type)).not.toContain("a_recontacter");
    expect(apres.taux_traitement).toBe(100);
  });

  it("retranche un dossier modifié entre le calcul et la suppression", async () => {
    const reste = dossier({ situation: SITUATION_ENUM.RDV_PRIS });
    const part = dossier({ situation: SITUATION_ENUM.RDV_PRIS });
    await inserer([reste, part]);
    const original = await vi.importActual<typeof import("./compteurs-dossiers-ml")>("./compteurs-dossiers-ml");
    vi.mocked(compteurs.calculerContributions).mockImplementationOnce(async (dossiers) => {
      const contributions = await original.calculerContributions(dossiers);
      await missionLocaleEffectifsDb().updateOne(
        { _id: reste._id },
        { $set: { date_rupture: date("2026-06-01") } },
        { bypassDocumentValidation: true }
      );
      return contributions;
    });

    const resultat = await purgerDossiersSuivi({ maintenant });

    expect(resultat.missionLocale).toMatchObject({ supprimes: 1, comptes: 1 });
    expect(await missionLocaleEffectifsDb().countDocuments({ _id: reste._id })).toBe(1);
    const purges = await missionLocaleStatsPurgesDb().findOne({ mission_locale_id: ML_ID });
    expect(purges?.stats).toMatchObject({ total: 1, traite: 1, rdv_pris: 1 });
    const lignes = await missionLocaleEffectifsPurgesStatsDb().find({ type: "suivi" }).toArray();
    expect(lignes.map(({ compteurs }) => compteurs)).toStrictEqual([{ dossiers: 1, v2_dossiers: 0 }]);
  });

  it("garde le total et le taux de traités des tableaux de suivi et de l'export", async () => {
    const { vivant, jamaisTraite } = jeu();
    await inserer([vivant, jamaisTraite]);
    const suivi = (ligne: Record<string, unknown>) => ({
      total_jeunes: ligne.total_jeunes,
      pourcentage_traites: ligne.pourcentage_traites,
    });
    const lire = async () => {
      await createOrUpdateMissionLocaleStats(ML_ID);
      const [parMl, parRegion, export_] = await Promise.all([
        getTraitementStatsByMissionLocale({
          period: "30days",
          segment: "all",
          page: 1,
          limit: 10,
          sort_by: "nom",
          sort_order: "asc",
        }),
        getSuiviTraitementByRegion("all"),
        getTraitementExportData({}),
      ]);
      return {
        parMl: parMl.data.map(suivi),
        parRegion: parRegion.map(suivi),
        exportMl: export_.mlData.map(suivi),
        exportRegion: export_.regionData.map(suivi),
        exportRupture: export_.rows_rupture.map(suivi),
      };
    };
    const avant = await lire();

    await purgerDossiersSuivi({ maintenant });

    expect(avant.parMl).toStrictEqual([{ total_jeunes: 2, pourcentage_traites: 50 }]);
    expect(avant.parRegion).toStrictEqual([{ total_jeunes: 2, pourcentage_traites: 50 }]);
    expect(await lire()).toStrictEqual(avant);
  });

  it("supprime les logs des dossiers supprimés quand l'écriture des compteurs échoue", async () => {
    const traite = dossier({ situation: SITUATION_ENUM.RDV_PRIS });
    await inserer([traite]);
    await missionLocaleEffectifsLogDb().insertOne({
      _id: new ObjectId(),
      mission_locale_effectif_id: traite._id,
      situation: SITUATION_ENUM.RDV_PRIS,
      commentaires: "texte libre",
      created_at: date("2025-04-01"),
      created_by: null,
      read_by: [],
    } as IMissionLocaleEffectifLog);
    vi.mocked(compteurs.ecrireContributions).mockRejectedValueOnce(new Error("wtimeout"));

    await expect(purgerDossiersSuivi({ maintenant })).rejects.toThrow("wtimeout");

    expect(await missionLocaleEffectifsDb().countDocuments({ _id: traite._id })).toBe(0);
    expect(await missionLocaleEffectifsLogDb().countDocuments({ mission_locale_effectif_id: traite._id })).toBe(0);
  });

  it("n'ajoute à une photo passée que les dossiers purgés créés jusqu'à son mois", async () => {
    await inserer([
      dossier({ rupture: "2025-03-10", situation: SITUATION_ENUM.RDV_PRIS }),
      dossier({ rupture: "2025-05-10", situation: SITUATION_ENUM.RDV_PRIS }),
    ]);
    await purgerDossiersSuivi({ maintenant });
    const fevrier = date("2025-02-01");
    const avril = date("2025-04-01");

    await createMissionLocaleStatsIfMissing(ML_ID, fevrier);
    await setMissionLocaleStatsFields(ML_ID, fevrier, ["stats.traite"]);
    await createMissionLocaleStatsIfMissing(ML_ID, avril);

    const photos = await missionLocaleStatsDb()
      .find({}, { sort: { computed_day: 1 } })
      .toArray();
    expect(photos.map(({ computed_day, stats }) => [computed_day, stats.total, stats.traite])).toStrictEqual([
      [fevrier, 0, 0],
      [avril, 1, 1],
    ]);
    expect((await photoDuJour()).stats).toMatchObject({ total: 2, traite: 2 });
    expect(await getMissionLocaleStat(ML_ORGANISATION)).toMatchObject({ total: 2, traite: 2 });
  });

  it("n'écrit aucune contribution de photo pour un groupe dont aucun dossier n'est supprimé", async () => {
    const invisible = dossier({ age: 40, situation: SITUATION_ENUM.RDV_PRIS });
    await inserer([invisible]);
    const original = await vi.importActual<typeof import("./compteurs-dossiers-ml")>("./compteurs-dossiers-ml");
    vi.mocked(compteurs.calculerContributions).mockImplementationOnce(async (dossiers) => {
      const contributions = await original.calculerContributions(dossiers);
      await missionLocaleEffectifsDb().updateOne(
        { _id: invisible._id },
        {
          $set: {
            date_rupture: date("2026-06-01"),
            "effectif_snapshot.apprenant.date_de_naissance": new Date(
              new Date().setFullYear(new Date().getFullYear() - 20)
            ),
          },
        },
        { bypassDocumentValidation: true }
      );
      return contributions;
    });

    const resultat = await purgerDossiersSuivi({ maintenant });

    expect(resultat.missionLocale.supprimes).toBe(0);
    expect(await missionLocaleStatsPurgesDb().countDocuments()).toBe(0);
  });

  it("garde les traités et la collaboration du détail admin d'une ML, dossiers masqués compris", async () => {
    const { vivant, traite, masque } = jeu();
    await inserer([vivant, traite, masque]);
    const lire = async () => {
      const { traites_count, has_cfa_collaboration } = await getMissionLocaleDetail(ML_ID);
      return { traites_count, has_cfa_collaboration };
    };
    const avant = await lire();

    await purgerDossiersSuivi({ maintenant });

    expect(avant).toStrictEqual({ traites_count: 2, has_cfa_collaboration: false });
    expect(await lire()).toStrictEqual(avant);
  });

  it("garde le stock admin d'une ML sans dossier vivant, et celui des mineurs hors déjà connus", async () => {
    await inserer([
      dossier({ situation: SITUATION_ENUM.CHERCHE_CONTRAT }),
      dossier({ age: 17, situation: SITUATION_ENUM.RDV_PRIS, dejaConnu: true }),
    ]);
    const sansId = ({ _id, ...stats }: Record<string, unknown>) => stats;
    const lire = async () =>
      (await Promise.all([getMissionLocaleStat(ML_ORGANISATION), getMissionLocaleStat(ML_ORGANISATION, true)])).map(
        sansId
      );
    const [tous, mineurs] = await lire();

    await purgerDossiersSuivi({ maintenant });

    expect(tous).toMatchObject({ total: 2, traite: 2, cherche_contrat: 1, rdv_pris: 1, deja_connu: 1 });
    expect(mineurs).toMatchObject({ total: 1, traite: 1, rdv_pris: 1, deja_connu: 1 });
    const [tousApres, mineursApres] = await lire();
    expect(tousApres).toStrictEqual({ ...tous, a_traiter: 0 });
    expect(mineursApres).toStrictEqual({ ...mineurs, a_traiter: 0, deja_connu: 0 });
  });

  it("garde les traités purgés dans l'admin ML, hors stock à traiter", async () => {
    const { vivant, traite, jamaisTraite } = jeu();
    await inserer([vivant, traite, jamaisTraite]);
    const avant = await getMissionLocaleStat(ML_ORGANISATION);

    await purgerDossiersSuivi({ maintenant });

    expect(avant).toMatchObject({ total: 3, a_traiter: 1, traite: 2, rdv_pris: 2 });
    expect(await getMissionLocaleStat(ML_ORGANISATION)).toStrictEqual({ ...avant, a_traiter: 0 });
    expect((await getMissionLocaleDetail(ML_ID)).traites_count).toBe(2);
  });
});

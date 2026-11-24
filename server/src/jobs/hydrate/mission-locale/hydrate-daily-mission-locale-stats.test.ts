import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import type { IMissionLocaleEffectif, IOrganisationMissionLocale } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { zMissionLocaleStatsCompteurs } from "shared/models/data/missionLocaleStats.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { normalizeToUTCDay } from "shared/utils/date";
import { beforeEach, describe, expect, it } from "vitest";

import { buildEmptySegments } from "@/common/actions/mission-locale/mission-locale-stats.helpers";
import { missionLocaleEffectifsDb, missionLocaleStatsDb, organisationsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { hydrateDailyMissionLocaleStats } from "./hydrate-mission-locale";

useMongo();

const ML_ID = new ObjectId();

const jourUtc = (decalage: number) => {
  const jour = normalizeToUTCDay(new Date());
  jour.setUTCDate(jour.getUTCDate() - decalage);
  return jour;
};

const photoExistante = (computed_day: Date) => ({
  _id: new ObjectId(),
  mission_locale_id: ML_ID,
  computed_day,
  created_at: computed_day,
  stats: { ...zMissionLocaleStatsCompteurs.parse({}), total: 99, traite: 99 },
  segments: buildEmptySegments(),
});

describe("hydrateDailyMissionLocaleStats()", () => {
  beforeEach(async () => {
    await organisationsDb().insertOne(
      {
        _id: ML_ID,
        type: "MISSION_LOCALE",
        ml_id: 4242,
        nom: "ML Test",
        created_at: new Date("2025-01-01"),
        activated_at: new Date("2025-03-01"),
      } as IOrganisationMissionLocale as IOrganisation,
      { bypassDocumentValidation: true }
    );
    await missionLocaleEffectifsDb().insertOne(
      {
        _id: new ObjectId(),
        mission_locale_id: ML_ID,
        effectif_id: new ObjectId(),
        created_at: jourUtc(2),
        date_rupture: jourUtc(30),
        current_status: { value: STATUT_APPRENANT.RUPTURANT, date: jourUtc(30) },
        situation: SITUATION_ENUM.RDV_PRIS,
        effectif_snapshot: {
          _id: new ObjectId(),
          organisme_id: new ObjectId(),
          source: SOURCE_APPRENANT.ERP,
          annee_scolaire: "2026-2027",
          apprenant: {
            nom: "DOE",
            prenom: "John",
            date_de_naissance: new Date(new Date().setFullYear(new Date().getFullYear() - 20)),
          },
          _computed: { statut: { en_cours: STATUT_APPRENANT.RUPTURANT } },
        },
      } as unknown as IMissionLocaleEffectif,
      { bypassDocumentValidation: true }
    );
  });

  it("crée les photos absentes sans réécrire les photos existantes", async () => {
    await missionLocaleStatsDb().insertOne(photoExistante(jourUtc(1)));

    await hydrateDailyMissionLocaleStats();

    const photos = await missionLocaleStatsDb()
      .find({}, { sort: { computed_day: 1 } })
      .toArray();
    expect(photos.map(({ computed_day }) => computed_day)).toStrictEqual([jourUtc(2), jourUtc(1), jourUtc(0)]);
    expect(photos.map(({ stats }) => stats.total)).toStrictEqual([1, 99, 1]);
  });

  it("pose seulement les champs nommés sur les photos existantes", async () => {
    await missionLocaleStatsDb().insertOne(photoExistante(jourUtc(1)));

    await hydrateDailyMissionLocaleStats({ champs: ["stats.traite"] });

    const photo = await missionLocaleStatsDb().findOne({ computed_day: jourUtc(1) });
    expect(photo?.stats).toMatchObject({ total: 99, traite: 1 });
  });

  it("refuse un champ inconnu avant tout calcul", async () => {
    await expect(hydrateDailyMissionLocaleStats({ champs: ["stats.inconnu"] })).rejects.toThrow(
      "Champs de photo ML inconnus : stats.inconnu"
    );
    expect(await missionLocaleStatsDb().countDocuments()).toBe(0);
  });
});

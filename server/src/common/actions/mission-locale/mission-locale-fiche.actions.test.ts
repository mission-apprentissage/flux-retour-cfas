import { ObjectId } from "bson";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { describe, expect, it } from "vitest";

import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb, organisationsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { getMissionLocaleFicheIndicateurs } from "./mission-locale-fiche.actions";

useMongo();

const insertMl = async (derniereActivite?: Date) => {
  const _id = new ObjectId();
  await organisationsDb().insertOne(
    {
      _id,
      type: "MISSION_LOCALE",
      ml_id: 900 + Math.floor(Math.random() * 1000),
      nom: "ML Fiche",
      created_at: new Date(),
      ...(derniereActivite ? { derniere_activite: derniereActivite } : {}),
    } as IOrganisation,
    { bypassDocumentValidation: true }
  );
  return _id;
};

const insertReponseWhatsapp = async (missionLocaleId: ObjectId, date: Date) => {
  const effectifId = new ObjectId();
  await missionLocaleEffectifsDb().insertOne(
    { _id: effectifId, mission_locale_id: missionLocaleId, situation: "NE_SOUHAITE_PAS_ETRE_RECONTACTE" } as never,
    { bypassDocumentValidation: true }
  );
  await missionLocaleEffectifsLogDb().insertOne(
    {
      _id: new ObjectId(),
      mission_locale_effectif_id: effectifId,
      situation: "NE_SOUHAITE_PAS_ETRE_RECONTACTE",
      created_at: date,
      created_by: null,
      read_by: [],
    } as never,
    { bypassDocumentValidation: true }
  );
};

describe("getMissionLocaleFicheIndicateurs", () => {
  it("ne compte pas une réponse WhatsApp du jeune comme une activité de la ML", async () => {
    const mlId = await insertMl();
    await insertReponseWhatsapp(mlId, new Date("2026-10-04"));

    const indicateurs = await getMissionLocaleFicheIndicateurs(mlId, new Date("2026-11-24"));

    expect(indicateurs.derniere_activite_at).toBeNull();
  });

  it("reprend la dernière activité d'un conseiller", async () => {
    const mlId = await insertMl(new Date("2026-11-20"));
    await insertReponseWhatsapp(mlId, new Date("2026-11-22"));

    const indicateurs = await getMissionLocaleFicheIndicateurs(mlId, new Date("2026-11-24"));

    expect(indicateurs.derniere_activite_at).toEqual(new Date("2026-11-20"));
  });
});

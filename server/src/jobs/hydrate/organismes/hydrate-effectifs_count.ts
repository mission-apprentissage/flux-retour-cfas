import type { ObjectId } from "mongodb";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";

import { updateEffectifsCount } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { effectifsDb, effectifsDECADb, organismesDb } from "@/common/model/collections";

const BULK_SIZE = 1_000;

type ICompteurOrganisme = { _id: ObjectId | null; total: number };

const compterEffectifsAnneesActives = async (): Promise<Map<string, number>> => {
  const pipeline = [
    { $match: { annee_scolaire: { $in: getActiveAnneesScolaires(new Date()) } } },
    { $group: { _id: "$organisme_id", total: { $sum: 1 } } },
  ];
  const [erp, deca] = await Promise.all([
    effectifsDb().aggregate<ICompteurOrganisme>(pipeline).toArray(),
    effectifsDECADb().aggregate<ICompteurOrganisme>(pipeline).toArray(),
  ]);

  const compteurs = new Map<string, number>();
  for (const { _id, total } of [...erp, ...deca]) {
    if (_id) {
      compteurs.set(_id.toString(), (compteurs.get(_id.toString()) ?? 0) + total);
    }
  }
  return compteurs;
};

const ecrireEffectifsAnneesActives = async (organismeIds: ObjectId[], compteurs: Map<string, number>) => {
  for (let i = 0; i < organismeIds.length; i += BULK_SIZE) {
    await organismesDb().bulkWrite(
      organismeIds.slice(i, i + BULK_SIZE).map((_id) => ({
        updateOne: {
          filter: { _id },
          update: { $set: { effectifs_annees_actives_count: compteurs.get(_id.toString()) ?? 0 } },
        },
      })),
      { ordered: false, bypassDocumentValidation: true }
    );
  }
};

export const hydrateOrganismesEffectifsCount = async () => {
  const compteurs = await compterEffectifsAnneesActives();
  const organismes = await organismesDb().find({}).toArray();

  logger.info(`Processing ${organismes.length} organismes`);
  for (var i = 0; i < organismes.length; i++) {
    const organisme = organismes[i];
    await updateEffectifsCount(organisme._id);
  }
  await ecrireEffectifsAnneesActives(
    organismes.map((organisme) => organisme._id),
    compteurs
  );
  logger.info({ avecEffectifsAnneesActives: compteurs.size }, `${organismes.length} organismes processed`);
};

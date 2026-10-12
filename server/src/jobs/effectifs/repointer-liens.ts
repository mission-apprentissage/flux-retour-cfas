import type { ObjectId } from "mongodb";
import type { IEffectif } from "shared/models/data/effectifs.model";

import { getCurrentAndNextStatus } from "@/common/actions/effectifs.statut.actions";
import { computedOrganismeMl } from "@/common/actions/mission-locale/mission-locale-record.actions";
import { migrateMlRecordEffectifId } from "@/common/actions/mission-locale/mission-locale.actions";
import { franceTravailEffectifsDb, missionLocaleEffectifsDb, voeuxAffelnetDb } from "@/common/model/collections";

export interface ResultatRepointage {
  ml: { repointes: number; fusionnes: number; refuses: number };
  france_travail: { repointes: number; fusionnes: number };
  voeux: number;
  missions_locales: ObjectId[];
}

export function resultatRepointageVide(): ResultatRepointage {
  return {
    ml: { repointes: 0, fusionnes: 0, refuses: 0 },
    france_travail: { repointes: 0, fusionnes: 0 },
    voeux: 0,
    missions_locales: [],
  };
}

async function repointerDossiersMl(ficheId: ObjectId, jumeau: IEffectif, resultat: ResultatRepointage) {
  const dossiers = await missionLocaleEffectifsDb()
    .find({ effectif_id: ficheId, soft_deleted: { $ne: true } })
    .toArray();
  if (dossiers.length === 0) {
    return;
  }
  const extraSet = { "computed.organisme": await computedOrganismeMl(jumeau.organisme_id) };

  for (const dossier of dossiers) {
    const { keeperId, skipped } = await migrateMlRecordEffectifId(dossier._id, ficheId, jumeau, { extraSet });
    if (skipped) {
      resultat.ml.refuses++;
      continue;
    }
    resultat.missions_locales.push(dossier.mission_locale_id);
    if (keeperId.equals(dossier._id)) {
      resultat.ml.repointes++;
    } else {
      resultat.ml.fusionnes++;
    }
  }
}

function statutCourant(effectif: IEffectif) {
  const { current } = getCurrentAndNextStatus(effectif._computed?.statut?.parcours);
  return { value: current?.valeur ?? null, date: current?.date ?? null };
}

async function repointerDossiersFranceTravail(ficheId: ObjectId, jumeau: IEffectif, resultat: ResultatRepointage) {
  const dossiers = await franceTravailEffectifsDb()
    .find({ effectif_id: ficheId, soft_deleted: { $ne: true } })
    .toArray();
  const now = new Date();

  for (const { _id: ancienId, ...dossier } of dossiers) {
    const existant = await franceTravailEffectifsDb().findOne({ _id: jumeau._id });
    if (existant) {
      const donneesManquantes = Object.fromEntries(
        Object.entries(dossier.ft_data)
          .filter(([secteur, valeur]) => valeur != null && existant.ft_data?.[secteur] == null)
          .map(([secteur, valeur]) => [`ft_data.${secteur}`, valeur])
      );
      await franceTravailEffectifsDb().updateOne(
        { _id: existant._id },
        { $set: { ...donneesManquantes, soft_deleted: false, updated_at: now } }
      );
      resultat.france_travail.fusionnes++;
    } else {
      const region = jumeau.apprenant?.adresse?.region ?? dossier.code_region;
      await franceTravailEffectifsDb().insertOne({
        ...dossier,
        _id: jumeau._id,
        effectif_id: jumeau._id,
        effectif_snapshot: jumeau,
        effectif_snapshot_date: now,
        current_status: statutCourant(jumeau),
        updated_at: now,
        ...(region ? { code_region: region } : {}),
      });
      resultat.france_travail.repointes++;
    }
    await franceTravailEffectifsDb().updateOne({ _id: ancienId }, { $set: { soft_deleted: true, updated_at: now } });
  }
}

async function repointerVoeux(ficheId: ObjectId, jumeau: IEffectif, resultat: ResultatRepointage) {
  const { modifiedCount } = await voeuxAffelnetDb().updateMany(
    { effectif_id: ficheId },
    { $set: { effectif_id: jumeau._id } }
  );
  resultat.voeux += modifiedCount;
}

export async function repointerLiensVersJumeau(ficheId: ObjectId, jumeau: IEffectif): Promise<ResultatRepointage> {
  const resultat = resultatRepointageVide();
  await repointerDossiersMl(ficheId, jumeau, resultat);
  if (resultat.ml.refuses > 0) {
    return resultat;
  }
  await repointerDossiersFranceTravail(ficheId, jumeau, resultat);
  await repointerVoeux(ficheId, jumeau, resultat);
  return resultat;
}

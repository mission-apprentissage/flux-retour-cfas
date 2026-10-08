import { ObjectId } from "bson";
import type {
  CollabCfaOrigineSortBy,
  ICollabCfaOrigineResponse,
  ICollabCfaOrigineRow,
} from "shared/models/data/nationalStats.model";

import { missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";

const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

const compareRows = (sortBy: CollabCfaOrigineSortBy) => (a: ICollabCfaOrigineRow, b: ICollabCfaOrigineRow) => {
  switch (sortBy) {
    case "collaborations":
      return a.collaborations - b.collaborations;
    case "localisation":
      return collator.compare(`${a.code_postal ?? ""} ${a.commune ?? ""}`, `${b.code_postal ?? ""} ${b.commune ?? ""}`);
    case "nom":
      return collator.compare(a.nom ?? "", b.nom ?? "");
  }
};

export async function listCollaborationsCfaOrigine(
  missionLocaleId: ObjectId,
  options: { page: number; limit: number; sort_by: CollabCfaOrigineSortBy; sort_order: "asc" | "desc" },
  now: Date = new Date()
): Promise<ICollabCfaOrigineResponse> {
  const groupes = await missionLocaleEffectifsDb()
    .aggregate<{ _id: ObjectId | null; collaborations: number }>([
      {
        $match: {
          mission_locale_id: missionLocaleId,
          "organisme_data.acc_conjoint": true,
          "organisme_data.acc_conjoint_at": { $lte: now },
          soft_deleted: { $ne: true },
        },
      },
      { $group: { _id: "$effectif_snapshot.organisme_id", collaborations: { $sum: 1 } } },
    ])
    .toArray();

  const organismeIds = groupes.flatMap((groupe) => (groupe._id ? [groupe._id] : []));
  const organismes = await organismesDb()
    .find(
      { _id: { $in: organismeIds } },
      {
        projection: {
          enseigne: 1,
          raison_sociale: 1,
          uai: 1,
          siret: 1,
          "adresse.code_postal": 1,
          "adresse.commune": 1,
          "adresse.complete": 1,
        },
      }
    )
    .toArray();
  const organismeById = new Map(organismes.map((organisme) => [organisme._id.toString(), organisme]));

  const rows = groupes.map((groupe): ICollabCfaOrigineRow => {
    const organisme = groupe._id ? organismeById.get(groupe._id.toString()) : undefined;
    return {
      organisme_id: groupe._id?.toString() ?? "",
      nom: (organisme?.enseigne || organisme?.raison_sociale)?.trim() || null,
      uai: organisme?.uai ?? null,
      siret: organisme?.siret ?? null,
      code_postal: organisme?.adresse?.code_postal ?? null,
      commune: organisme?.adresse?.commune ?? null,
      adresse: organisme?.adresse?.complete ?? null,
      collaborations: groupe.collaborations,
    };
  });

  const direction = options.sort_order === "asc" ? 1 : -1;
  const compare = compareRows(options.sort_by);
  rows.sort((a, b) => direction * compare(a, b) || collator.compare(a.nom ?? "", b.nom ?? ""));

  const { page, limit } = options;
  return {
    total: rows.length,
    pagination: { page, limit, total_pages: Math.ceil(rows.length / limit) },
    data: rows.slice((page - 1) * limit, page * limit),
  };
}

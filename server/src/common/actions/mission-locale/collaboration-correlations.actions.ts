import type { Document } from "mongodb";
import type {
  CollabDossierResultat,
  ICollabCorrelationRow,
  ICollabCorrelationsResponse,
} from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay } from "shared/utils/date";
import { getBornesNaissanceMissionLocale } from "shared/utils/missionLocaleAge";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

import { RESULTAT_SITUATIONS } from "./collaboration-dossiers.actions";
import { buildCollabMatch, resolveMissionLocaleIds } from "./mission-locale-stats.actions";
import { addCollabSituationField } from "./mission-locale.actions";

const SITUATIONS = [
  "rupture",
  "abandon",
  "prevention_inevitable",
  "prevention_tres_eleve",
  "prevention_modere",
  "besoin_aide_hors_rupture",
] as const;

const OBJECTIFS: Record<string, string> = {
  REORIENTATION: "reorientation",
  RECHERCHE_EMPLOI: "recherche_emploi",
  MOBILITE: "mobilite",
  LOGEMENT: "logement",
  SOCIAL_FAMILIAL: "social_familial",
  ADMINISTRATIF: "administratif",
  SANTE: "sante",
  FINANCE: "finance",
  AUTRE: "autre",
};

const RESULTATS = Object.keys(RESULTAT_SITUATIONS) as CollabDossierResultat[];

const croisement = (cle: string): Document[] => [
  {
    $group: {
      _id: cle,
      total: { $sum: 1 },
      ...Object.fromEntries(
        RESULTATS.map((resultat) => [
          resultat,
          { $sum: { $cond: [{ $in: [{ $ifNull: ["$situation", null] }, RESULTAT_SITUATIONS[resultat]] }, 1, 0] } },
        ])
      ),
    },
  },
];

type Groupe = { _id: string | null; total: number } & Record<CollabDossierResultat, number>;

const versLigne = (cle: string, groupe: Groupe | undefined): ICollabCorrelationRow => {
  const resultats = Object.fromEntries(RESULTATS.map((resultat) => [resultat, groupe?.[resultat] ?? 0])) as Record<
    CollabDossierResultat,
    number
  >;
  return {
    cle,
    total: groupe?.total ?? 0,
    traites: Object.values(resultats).reduce((somme, valeur) => somme + valeur, 0),
    resultats,
  };
};

/** Même périmètre de dossiers que les objectifs des chiffres clés (territoire de la ML, tranche d'âge actuelle). */
export async function getCollaborationCorrelations(
  regions?: string[],
  mlId?: string
): Promise<ICollabCorrelationsResponse> {
  const missionLocaleIds = await resolveMissionLocaleIds(regions, mlId);
  const { nesApres, nesAvant } = getBornesNaissanceMissionLocale();

  const [result] = await missionLocaleEffectifsDb()
    .aggregate<{ situations: Groupe[]; objectifs: Groupe[] }>([
      {
        $match: {
          ...buildCollabMatch(normalizeToUTCDay(new Date()), missionLocaleIds),
          "effectif_snapshot.apprenant.date_de_naissance": { $gte: nesApres, $lte: nesAvant },
        },
      },
      addCollabSituationField(),
      {
        $facet: {
          situations: croisement("$collab_situation"),
          objectifs: [{ $unwind: "$organisme_data.motif" }, ...croisement("$organisme_data.motif")],
        },
      },
    ])
    .toArray();

  const situations = new Map((result?.situations ?? []).map((groupe) => [groupe._id, groupe]));
  const objectifs = new Map((result?.objectifs ?? []).map((groupe) => [groupe._id, groupe]));
  return {
    situations: SITUATIONS.map((cle) => versLigne(cle, situations.get(cle))),
    objectifs: Object.entries(OBJECTIFS).map(([motif, cle]) => versLigne(cle, objectifs.get(motif))),
  };
}

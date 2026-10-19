import type { Document } from "mongodb";
import type {
  CollabDossierResultat,
  ICollabCorrelationRow,
  ICollabCorrelationsResponse,
} from "shared/models/data/nationalStats.model";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

import { RESULTAT_SITUATIONS } from "./collaboration-dossiers.actions";
import { buildCollabMatch, buildCollabPerimetreMatch } from "./mission-locale-stats.actions";
import type { Territoire } from "./mission-locale-stats.helpers";
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

/** Même périmètre de dossiers que les chiffres clés : CFA du territoire ou ML de la fiche, tous les dossiers envoyés. */
export async function getCollaborationCorrelations(
  territoire: Territoire = {},
  mlId?: string
): Promise<ICollabCorrelationsResponse> {
  const perimetre = await buildCollabPerimetreMatch(territoire, mlId);

  const [result] = await missionLocaleEffectifsDb()
    .aggregate<{ situations: Groupe[]; objectifs: Groupe[] }>([
      {
        $match: {
          ...buildCollabMatch(new Date()),
          ...perimetre,
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

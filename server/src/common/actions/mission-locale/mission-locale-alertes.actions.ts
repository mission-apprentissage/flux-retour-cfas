import { ObjectId } from "bson";
import {
  ML_ALERTE_SEUILS,
  type IMlAlerteListeRow,
  type ITraitementMLStatsResponse,
  type MlAlerteListeSortBy,
  type MlAlerteListeType,
} from "shared/models/data/nationalStats.model";

import { organisationsDb } from "@/common/model/collections";

import { getTraitementStatsByMissionLocale } from "./mission-locale-stats.actions";

type LigneSuivi = ITraitementMLStatsResponse["data"][number];

/** Mêmes règles que les alertes de la fiche ML, appliquées à toutes les ML du territoire. */
const CRITERES: Record<
  MlAlerteListeType,
  {
    segment: "rupture" | "collab";
    utiliseService?: boolean;
    engagee?: boolean;
    retenir: (ligne: LigneSuivi) => boolean;
  }
> = {
  non_engagee: { segment: "rupture", utiliseService: true, engagee: false, retenir: () => true },
  delai_collab: {
    segment: "collab",
    retenir: (ligne) =>
      ligne.delai_moyen_jours !== null && ligne.delai_moyen_jours > ML_ALERTE_SEUILS.delai_collab_jours,
  },
  a_recontacter: {
    segment: "collab",
    retenir: (ligne) => ligne.details.a_recontacter > ML_ALERTE_SEUILS.a_recontacter,
  },
  collab_sans_compte: { segment: "collab", utiliseService: false, retenir: (ligne) => ligne.total_jeunes > 0 },
};

const TOUTES_LES_LIGNES = 100_000;

const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });
const nombre = (valeur: number | null, absent: number) => valeur ?? absent;

const COMPARATEURS: Record<MlAlerteListeSortBy, (a: IMlAlerteListeRow, b: IMlAlerteListeRow) => number> = {
  nom: (a, b) => collator.compare(a.nom, b.nom),
  localisation: (a, b) =>
    collator.compare(`${a.code_postal ?? ""} ${a.commune ?? ""}`, `${b.code_postal ?? ""} ${b.commune ?? ""}`),
  total_jeunes: (a, b) => a.total_jeunes - b.total_jeunes,
  a_traiter: (a, b) => a.a_traiter - b.a_traiter,
  a_recontacter: (a, b) => a.a_recontacter - b.a_recontacter,
  pourcentage_traites: (a, b) => a.pourcentage_traites - b.pourcentage_traites,
  delai_moyen_jours: (a, b) => nombre(a.delai_moyen_jours, -1) - nombre(b.delai_moyen_jours, -1),
  activite: (a, b) =>
    nombre(a.jours_depuis_activite, Number.MAX_SAFE_INTEGER) - nombre(b.jours_depuis_activite, Number.MAX_SAFE_INTEGER),
};

export async function listMlAlertes(
  type: MlAlerteListeType,
  territoire: { region?: string; regions?: string[] },
  tri: { sort_by: MlAlerteListeSortBy; sort_order: "asc" | "desc" }
): Promise<IMlAlerteListeRow[]> {
  const critere = CRITERES[type];
  const suivi = await getTraitementStatsByMissionLocale({
    period: "30days",
    segment: critere.segment,
    region: territoire.region,
    regions: territoire.regions,
    page: 1,
    limit: TOUTES_LES_LIGNES,
    sort_by: "nom",
    sort_order: "asc",
    utiliseService: critere.utiliseService,
    engagee: critere.engagee,
  });
  const lignes = suivi.data.filter(critere.retenir);

  const adresses = await organisationsDb()
    .find(
      { _id: { $in: lignes.map((ligne) => new ObjectId(ligne.id)) } },
      { projection: { "adresse.code_postal": 1, "adresse.commune": 1 } }
    )
    .toArray();
  const adresseParId = new Map(
    adresses.map((ml) => [ml._id.toString(), (ml as { adresse?: { code_postal?: string; commune?: string } }).adresse])
  );

  const rows = lignes.map((ligne): IMlAlerteListeRow => {
    const adresse = adresseParId.get(ligne.id);
    return {
      id: ligne.id,
      nom: ligne.nom,
      code_postal: adresse?.code_postal ?? null,
      commune: adresse?.commune ?? null,
      total_jeunes: ligne.total_jeunes,
      a_traiter: ligne.a_traiter,
      a_recontacter: ligne.details.a_recontacter,
      pourcentage_traites: ligne.pourcentage_traites,
      delai_moyen_jours: ligne.delai_moyen_jours,
      jours_depuis_activite: ligne.jours_depuis_activite,
      is_activated: ligne.is_activated,
    };
  });

  const direction = tri.sort_order === "asc" ? 1 : -1;
  return rows.sort((a, b) => direction * COMPARATEURS[tri.sort_by](a, b) || collator.compare(a.nom, b.nom));
}

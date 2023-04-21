import Boom from "boom";
import { Parser } from "json2csv";

import { exportedFields } from "./export";
import {
  abandonsIndicator,
  apprentisIndicator,
  inscritsSansContratsIndicator,
  rupturantsIndicator,
} from "./indicators";

import {
  EffectifsFiltersWithRestriction,
  LegacyEffectifsFilters,
  buildMongoPipelineFilterStages,
} from "@/common/actions/helpers/filters";
import {
  getEffectifsAnonymesRestriction,
  requireOrganismeIndicateursAccess,
} from "@/common/actions/helpers/permissions";
import { EFFECTIF_INDICATOR_NAMES } from "@/common/constants/dossierApprenant";
import { organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

// Parse to french localized CSV with specific fields order & labels (; as delimiter and UTF8 using withBOM)
const CSV_DEFAULT_FIELDS = [
  {
    label: "Indicateur",
    value: "indicateur",
  },
  ...exportedFields.map((item) => ({
    label: item.label,
    value: item.csvField,
  })),
];

export async function exportAnonymizedEffectifsAsCSV(ctx: AuthContext, filters: LegacyEffectifsFilters) {
  const effectifs = await getAnonymisedEffectifsAtDate(ctx, filters);

  const json2csvParser = new Parser({
    fields: CSV_DEFAULT_FIELDS,
    delimiter: ";",
    withBOM: true,
  });
  const csvFile = await json2csvParser.parse(effectifs);
  return csvFile;
}

/**
 * Vérifie si l'utilisateur peut accéder aux effectifs anonymes.
 * Selon le contexte et les filtres, peut compléter les filtres avec une restriction (un territoire par exemple)
 */
async function checkEffectifsAnonymesPermissions(
  ctx: AuthContext,
  filters: LegacyEffectifsFilters
): Promise<EffectifsFiltersWithRestriction> {
  if (filters.organisme_id) {
    await requireOrganismeIndicateursAccess(ctx, filters.organisme_id);
  } else if (filters.uai_etablissement) {
    // comme on a pas l'organisme_id on doit retrouver l'organisme via uai
    const organisme = await organismesDb().findOne({
      uai: filters.uai_etablissement,
    });
    if (!organisme) {
      throw Boom.notFound("Organisme non trouvé");
    }
    await requireOrganismeIndicateursAccess(ctx, organisme._id);
  } else if (filters.siret_etablissement) {
    // comme on a pas l'organisme_id on doit retrouver l'organisme via siret
    const organisme = await organismesDb().findOne({
      siret: filters.siret_etablissement,
    });
    if (!organisme) {
      throw Boom.notFound("Organisme non trouvé");
    }
    await requireOrganismeIndicateursAccess(ctx, organisme._id);
  } else {
    // amend filters with a restriction
    (filters as EffectifsFiltersWithRestriction).restrictionMongo = await getEffectifsAnonymesRestriction(ctx);
  }

  return filters;
}

/**
 * Récupération des effectifs anonymisés à une date donnée
 */
async function getAnonymisedEffectifsAtDate(ctx: AuthContext, filters: EffectifsFiltersWithRestriction) {
  const filtersWithRestriction = await checkEffectifsAnonymesPermissions(ctx, filters);
  const filterStages = buildMongoPipelineFilterStages(filtersWithRestriction);
  const [apprentis, inscritsSansContrat, rupturants, abandons] = await Promise.all([
    apprentisIndicator.getFullExportFormattedListAtDate(filters.date, filterStages, EFFECTIF_INDICATOR_NAMES.apprentis),
    inscritsSansContratsIndicator.getFullExportFormattedListAtDate(
      filters.date,
      filterStages,
      EFFECTIF_INDICATOR_NAMES.inscritsSansContrats
    ),
    rupturantsIndicator.getFullExportFormattedListAtDate(
      filters.date,
      filterStages,
      EFFECTIF_INDICATOR_NAMES.rupturants
    ),
    abandonsIndicator.getFullExportFormattedListAtDate(filters.date, filterStages, EFFECTIF_INDICATOR_NAMES.abandons),
  ]);
  return [...apprentis, ...inscritsSansContrat, ...rupturants, ...abandons];
}

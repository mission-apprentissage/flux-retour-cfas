import { Parser } from "json2csv";

import { getExportAnonymizedEventNameFromFilters, USER_EVENTS_TYPES } from "../../constants/userEventsConstants.js";
import { AuthContext } from "../../model/internal/AuthContext.js";
import { Organisation } from "../../model/organisations.model.js";
import { EffectifsFilters } from "../helpers/filters";
import { getOrganisationRelatedOrganismes } from "../organismes/organismes.actions.js";
import { createUserEvent } from "../userEvents.actions.js";
import { getDataListEffectifsAtDate } from "./effectifs.actions.js";
import { exportedFields } from "./export.js";

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

async function getFiltersFromOrganisation(organisation: Organisation): Promise<any> {
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_REPONSABLE":
    case "ORGANISME_FORMATION_REPONSABLE_FORMATEUR": {
      // TODO restreindre aux organismes liés
      return {
        "organisme._id": {
          $in: await getOrganisationRelatedOrganismes(organisation.siret, organisation.uai),
        },
      };
    }

    case "TETE_DE_RESEAU":
      return { "organisme.reseaux": organisation.reseau };

    case "DREETS":
    case "DEETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return { "organisme.adresse.departement": organisation.code_region };
    case "DDETS":
      return { "organisme.adresse.departement": organisation.code_departement }; // FIXME valider si accès au reste en anonyme
    case "ACADEMIE":
      return { "organisme.adresse.academie": organisation.code_academie };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

export async function exportAnonymizedEffectifsAsCSV(authContext: AuthContext, filters: EffectifsFilters) {
  // TODO connaitre le contexte d'export des données pour mieux sécuriser les paramètres
  console.log("filers", await getFiltersFromOrganisation(authContext.organisation));
  await createUserEvent({
    type: USER_EVENTS_TYPES.EXPORT_CSV,
    action: getExportAnonymizedEventNameFromFilters(filters),
    username: authContext.email,
    data: filters,
  });

  const effectifs = await getDataListEffectifsAtDate(filters);

  const json2csvParser = new Parser({
    fields: CSV_DEFAULT_FIELDS,
    delimiter: ";",
    withBOM: true,
  });
  const csvFile = await json2csvParser.parse(effectifs);
  return csvFile;
}

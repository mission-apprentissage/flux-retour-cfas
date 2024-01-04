import Boom from "boom";
import { subYears } from "date-fns";
import { Filter, ObjectId } from "mongodb";
import { PermissionScope, assertUnreachable, entries, getAnneesScolaireListFromDate } from "shared";

import { SIRET_REGEX } from "@/common/constants/validations";
import { Effectif } from "@/common/model/@types";
import { escapeRegExp } from "@/common/utils/regexUtils";
import { isValidUAI } from "@/common/utils/validationUtils";

import { FullEffectifsFilters } from "../../helpers/filters";

// [min, max[
const intervalParTrancheAge = {
  "-18": [0, 18],
  "18-20": [18, 21],
  "21-25": [21, 26],
  "26+": [26, 999],
};

function buildOrganismeSearchCondition(value: string) {
  if (isValidUAI(value)) {
    return [{ "_computed.organisme.uai": value }];
  }
  if (SIRET_REGEX.test(value)) {
    return [{ "_computed.organisme.siret": value }];
  }
  if (/^\d{3,}$/.test(value)) {
    return [{ "_computed.organisme.siret": new RegExp(escapeRegExp(value)) }];
  }
  return [{ "_computed.organisme.nom": new RegExp(escapeRegExp(value)) }]; // TODO probablement ajouter un champ nom (enseigne + raison_sociale) de l'organisme
}

export function buildEffectifPerimetreMongoFilters(perimetre: PermissionScope | boolean): Filter<Effectif> {
  if (perimetre === false) {
    throw Boom.forbidden("Accés refusé");
  }

  if (perimetre === true) {
    return {};
  }

  return entries(perimetre).reduce((acc: Filter<Effectif>, [key, value]) => {
    switch (key) {
      case "id":
        acc["organisme_id"] = { $in: value.$in.map((v) => new ObjectId(v)) };
        break;
      case "region":
        acc["_computed.organisme.region"] = value;
        break;
      case "departement":
        acc["_computed.organisme.departement"] = value;
        break;
      case "academie":
        acc["_computed.organisme.academie"] = value;
        break;
      case "reseau":
        acc["_computed.organisme.reseaux"] = value;
        break;
      default:
        assertUnreachable(key);
    }

    return acc;
  }, {});
}

export function buildEffectifMongoFilters(
  filters: FullEffectifsFilters,
  perimetre: PermissionScope | boolean
): Filter<Effectif>[] {
  const perimetreFilter = buildEffectifPerimetreMongoFilters(perimetre);

  const requestedFilter = entries(filters).reduce((acc: Filter<Effectif>, [key, value]) => {
    switch (key) {
      case "date":
        acc["annee_scolaire"] = { $in: getAnneesScolaireListFromDate(value) };
        break;
      case "organisme_regions":
        acc["_computed.organisme.region"] = { $in: value };
        break;
      case "organisme_departements":
        acc["_computed.organisme.departement"] = { $in: value };
        break;
      case "organisme_academies":
        acc["_computed.organisme.academie"] = { $in: value };
        break;
      case "organisme_bassinsEmploi":
        acc["_computed.organisme.bassinEmploi"] = { $in: value };
        break;
      case "organisme_search":
        acc["$or"] = buildOrganismeSearchCondition(value);
        break;
      case "organisme_reseaux":
        acc["_computed.organisme.reseaux"] = { $in: value };
        break;
      case "apprenant_tranchesAge":
        acc["$or"] = value.map((key) => {
          const [min, max] = intervalParTrancheAge[key];
          return {
            "apprenant.date_de_naissance": {
              $lt: subYears(new Date(), min),
              $gte: subYears(new Date(), max),
            },
          };
        });
        break;
      case "formation_annees":
        acc["formation.annee"] = { $in: value };
        break;
      case "formation_niveaux":
        acc["formation.niveau"] = { $in: value };
        break;
      case "formation_cfds":
        acc["formation.cfd"] = { $in: value };
        break;
      case "formation_secteursProfessionnels":
        acc["_computed.formation.codes_rome"] = { $in: value };
        break;
      default:
        assertUnreachable(key);
    }

    return acc;
  }, {});

  return [requestedFilter, perimetreFilter];
}

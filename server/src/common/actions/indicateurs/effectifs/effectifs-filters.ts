import { zUai } from "api-alternance-sdk/internal";
import Boom from "boom";
import { subYears } from "date-fns";
import { Filter, ObjectId } from "mongodb";
import { PermissionScope, assertUnreachable, entries, getAnneesScolaireListFromDate, SIRET_REGEX } from "shared";
import { IEffectif } from "shared/models/data/effectifs.model";

import { escapeRegExp } from "@/common/utils/regexUtils";

import { FullEffectifsFilters } from "../../helpers/filters";

// [min, max[
const intervalParTrancheAge = {
  "-18": [0, 18],
  "18-20": [18, 21],
  "21-25": [21, 26],
  "26+": [26, 999],
};

function buildOrganismeSearchCondition(value: string) {
  if (zUai.safeParse(value).success) {
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

export function buildEffectifPerimetreMongoFilters(perimetre: PermissionScope | boolean): Filter<IEffectif> {
  if (perimetre === false) {
    throw Boom.forbidden("Accés refusé");
  }

  if (perimetre === true) {
    return {};
  }

  return entries(perimetre).reduce((acc: Filter<IEffectif>, [key, value]) => {
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

const buildFilterDate = (filter) => {
  const value = filter["date"];
  if (!value) {
    return {};
  }
  return { annee_scolaire: { $in: getAnneesScolaireListFromDate(value) } };
};

const buildFilterOrganismeRegions = (filter) => {
  const value = filter["organisme_regions"];
  if (!value) {
    return {};
  }

  return { "_computed.organisme.region": { $in: value } };
};

const buildFilterOrganismeDepartement = (filter) => {
  const value = filter["organisme_departements"];
  if (!value) {
    return {};
  }
  return { "_computed.organisme.departement": { $in: value } };
};

const buildFilterOrganismeAcademies = (filter) => {
  const value = filter["organisme_academies"];
  if (!value) {
    return {};
  }
  return { "_computed.organisme.academie": { $in: value } };
};

const buildFilterOrganismeBassinsEmploi = (filter) => {
  const value = filter["organisme_bassinsEmploi"];
  if (!value) {
    return {};
  }
  return { "_computed.organisme.bassinEmploi": { $in: value } };
};

const buildFilterOrganismeSearch = (filter) => {
  const value = filter["organisme_search"];
  if (!value) {
    return {};
  }
  return { $or: buildOrganismeSearchCondition(value) };
};

const buildFilterOrganismeReseaux = (filter) => {
  const value = filter["organisme_reseaux"];
  if (!value) {
    return {};
  }
  return { "_computed.organisme.reseaux": { $in: value } };
};

const buildFilterApprenantTrancheAge = (filter) => {
  const value = filter["apprenant_tranchesAge"];
  if (!value) {
    return {};
  }
  return {
    $or: value.map((key) => {
      const [min, max] = intervalParTrancheAge[key];
      return {
        "apprenant.date_de_naissance": {
          $lt: subYears(new Date(), min),
          $gte: subYears(new Date(), max),
        },
      };
    }),
  };
};

const buildFilterFormationAnnee = (filter) => {
  const value = filter["formation_annees"];
  if (!value) {
    return {};
  }
  return { "formation.annee": { $in: value } };
};

const buildFilterFormationNiveau = (filter) => {
  const value = filter["formation_niveaux"];
  if (!value) {
    return {};
  }
  return { "formation.niveau": { $in: value } };
};

const buildFilterFormationCfd = (filter) => {
  const value = filter["formation_cfds"];
  if (!value) {
    return {};
  }
  return { "formation.cfd": { $in: value } };
};

const buildFilterFormationSecteurProfessionnels = (filter) => {
  const value = filter["formation_secteursProfessionnels"];
  if (!value) {
    return {};
  }
  return { "_computed.formation.codes_rome": { $in: value } };
};

export function buildEffectifMongoFilters(
  filters: FullEffectifsFilters,
  perimetre: PermissionScope | boolean
): Filter<IEffectif>[] {
  const perimetreFilter = buildEffectifPerimetreMongoFilters(perimetre);

  const requestedFilter: Filter<IEffectif> = {
    ...buildFilterDate(filters),
    ...buildFilterOrganismeRegions(filters),
    ...buildFilterOrganismeDepartement(filters),
    ...buildFilterOrganismeAcademies(filters),
    ...buildFilterOrganismeBassinsEmploi(filters),
    ...buildFilterOrganismeSearch(filters),
    ...buildFilterOrganismeReseaux(filters),
    ...buildFilterApprenantTrancheAge(filters),
    ...buildFilterFormationAnnee(filters),
    ...buildFilterFormationNiveau(filters),
    ...buildFilterFormationCfd(filters),
    ...buildFilterFormationSecteurProfessionnels(filters),
  };
  return [requestedFilter, perimetreFilter];
}

import { NATURE_ORGANISME_DE_FORMATION } from "../../constants/natureOrganismeConstants.js";
import logger from "../../logger.js";
import { organismesDb } from "../../model/collections.js";
import { AuthContext } from "../../model/internal/AuthContext.js";
import { OrganisationOrganismeFormation } from "../../model/organisations.model.js";
import { getOrganismeById } from "../organismes/organismes.actions.js";

export async function canAccessOrganismeIndicateurs(authContext: AuthContext, organismeId: string): Promise<boolean> {
  const organisme = await getOrganismeById(organismeId);
  const organisation = authContext.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOFLinkedOrganismesIds(
        authContext as AuthContext<OrganisationOrganismeFormation>
      );
      return linkedOrganismesIds.includes(organismeId);
    }

    case "TETE_DE_RESEAU":
      return (organisme.reseaux as string[])?.includes(organisation.reseau);

    case "DREETS":
    case "DEETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return organisme.adresse?.region === organisation.code_region;
    case "DDETS":
      return organisme.adresse?.departement === organisation.code_departement;
    case "ACADEMIE":
      return organisme.adresse?.academie === organisation.code_academie;

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return true;
  }
}

export async function getOrganismeRestriction(authContext: AuthContext): Promise<any> {
  const organisation = authContext.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOFLinkedOrganismesIds(
        authContext as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        _id: {
          $in: linkedOrganismesIds,
        },
      };
    }

    case "TETE_DE_RESEAU":
      return {
        reseaux: organisation.reseau,
      };

    case "DREETS":
    case "DEETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return {
        "adresse.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "adresse.region": organisation.code_departement,
      };
    case "ACADEMIE":
      return {
        "adresse.region": organisation.code_academie,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

/*
TODO faire un 2e restriction adaptée à la collection organisme directement dans le $lookup organisme
*/
export async function getAggregatedIndicateursRestriction(authContext: AuthContext): Promise<any> {
  const organisation = authContext.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOFLinkedOrganismesIds(
        authContext as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        organisme_id: {
          $in: linkedOrganismesIds,
        },
      };
    }

    case "TETE_DE_RESEAU":
      return {
        "organisme.reseaux": organisation.reseau,
      };

    case "DREETS":
    case "DEETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return {
        "organisme.adresse.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "organisme.adresse.region": organisation.code_departement,
      };
    case "ACADEMIE":
      return {
        "organisme.adresse.region": organisation.code_academie,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

export async function findOFLinkedOrganismesIds(authContext: AuthContext<OrganisationOrganismeFormation>) {
  const organisation = authContext.organisation;
  const userOrganisme = await organismesDb().findOne({
    siret: organisation.siret,
    uai: organisation.uai,
  });
  if (!userOrganisme) {
    logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
    throw new Error("organisme de l'organisation non trouvé");
  }

  const subOrganismesIds = new Set<string>();
  if (
    userOrganisme.nature === NATURE_ORGANISME_DE_FORMATION.RESPONSABLE ||
    userOrganisme.nature === NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR
  ) {
    for (const { organismes } of userOrganisme.formations) {
      for (const subOrganismeCatalog of organismes) {
        if (
          subOrganismeCatalog.nature !== NATURE_ORGANISME_DE_FORMATION.LIEU &&
          subOrganismeCatalog.nature !== NATURE_ORGANISME_DE_FORMATION.INCONNUE &&
          userOrganisme.siret !== subOrganismeCatalog.siret
        ) {
          const subOrganisme = await organismesDb().findOne({ siret: subOrganismeCatalog.siret as string });
          if (!subOrganisme) {
            logger.error({ siret: subOrganismeCatalog.siret }, "sous-organisme non trouvé");
            throw new Error("organisme de l'organisation non trouvé");
          } else {
            subOrganismesIds.add(subOrganisme._id.toString());
          }
        }
      }
    }
  }
  return [...subOrganismesIds.values()];
}

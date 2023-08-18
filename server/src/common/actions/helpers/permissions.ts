import Boom from "boom";
import { uniq } from "lodash-es";
import { ObjectId, WithId } from "mongodb";

import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { Organisme } from "@/common/model/@types/Organisme";
import { organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { OrganisationOrganismeFormation, OrganisationType } from "@/common/model/organisations.model";

import { FullEffectifsFilters, buildMongoFilters, fullEffectifsFiltersConfigurations } from "./filters";

export async function requireOrganismeIndicateursAccess(ctx: AuthContext, organismeId: ObjectId): Promise<void> {
  if (!(await canAccessOrganismeIndicateurs(ctx, organismeId))) {
    throw Boom.forbidden("Permissions invalides");
  }
}

export function requireOrganisationOF(ctx: AuthContext): OrganisationOrganismeFormation {
  if (!isOrganisationOF(ctx.organisation.type)) {
    throw Boom.forbidden("Permissions invalides");
  }
  return (ctx as AuthContext<OrganisationOrganismeFormation>).organisation;
}

export async function getOrganismeRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
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
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return {
        "adresse.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "adresse.departement": organisation.code_departement,
      };
    case "ACADEMIE":
      return {
        "adresse.academie": organisation.code_academie,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

/**
 * Restriction pour accéder aux effectifs anonymes => FIXME devrait être supprimé ou changé pour indicateursEffectifs
 */
export async function getEffectifsAnonymesRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        organisme_id: {
          $in: linkedOrganismesIds,
        },
      };
    }

    case "TETE_DE_RESEAU":
      return {
        "_computed.organisme.reseaux": organisation.reseau,
      };

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return {
        "_computed.organisme.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "_computed.organisme.departement": organisation.code_departement,
      };
    case "ACADEMIE":
      return {
        "_computed.organisme.academie": organisation.code_academie,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

export async function getOrganismeIndicateursEffectifsRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        organisme_id: {
          $in: linkedOrganismesIds,
        },
      };
    }

    case "TETE_DE_RESEAU":
      return {
        "_computed.organisme.reseaux": organisation.reseau,
      };

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return {
        "_computed.organisme.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "_computed.organisme.departement": organisation.code_departement,
      };
    case "ACADEMIE":
      return {
        "_computed.organisme.academie": organisation.code_academie,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

/**
 * Restriction pour accéder aux effectifs nominatifs
 */
export async function getEffectifsNominatifsRestriction(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return {
        organisme_id: {
          $in: linkedOrganismesIds,
        },
      };
    }

    case "TETE_DE_RESEAU":
      return {
        _id: new ObjectId("000000000000"),
      };

    case "DREETS":
    case "DRAAF":
      return {
        "_computed.organisme.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "_computed.organisme.departement": organisation.code_departement,
      };

    case "CONSEIL_REGIONAL":
    case "ACADEMIE":
    case "OPERATEUR_PUBLIC_NATIONAL":
      return {
        _id: new ObjectId("000000000000"), // permet de tout rejeter
      };
    case "ADMINISTRATEUR":
      return {};
  }
}

/**
 * Liste tous les organismes accessibles pour une organisation (dont l'organisme lié à l'organisation)
 */
export async function findOrganismesAccessiblesByOrganisationOF(
  ctx: AuthContext<OrganisationOrganismeFormation>
): Promise<ObjectId[]> {
  const organisation = ctx.organisation;
  const userOrganisme = await organismesDb().findOne({
    siret: organisation.siret,
    uai: organisation.uai as string,
  });
  if (!userOrganisme) {
    logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
    throw new Error("organisme de l'organisation non trouvé");
  }

  return [userOrganisme._id, ...findOrganismeFormateursIds(userOrganisme)];
}

export async function findOrganismesFormateursIdsOfOrganisme(organismeId: ObjectId): Promise<ObjectId[]> {
  const organisme = await getOrganismeById(organismeId);
  return findOrganismeFormateursIds(organisme);
}

export function findOrganismeFormateursIds(organisme: Organisme): ObjectId[] {
  return (organisme.organismesFormateurs ?? [])
    .filter((organisme) => !!organisme._id)
    .map((organisme) => organisme._id as ObjectId);
}

export async function canAccessOrganismeIndicateurs(ctx: AuthContext, organismeId: ObjectId): Promise<boolean> {
  const organisme = await getOrganismeById(organismeId);
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return linkedOrganismesIds.some((linkedOrganismesId) => linkedOrganismesId.equals(organismeId));
    }

    case "TETE_DE_RESEAU":
      return (organisme.reseaux as string[])?.includes(organisation.reseau);

    case "DREETS":
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

export async function requireListOrganismesFormateursAccess(ctx: AuthContext, organismeId: ObjectId): Promise<void> {
  if (!(await canAccessOrganismesFormateurs(ctx, organismeId))) {
    throw Boom.forbidden("Permissions invalides");
  }
}

async function canAccessOrganismesFormateurs(ctx: AuthContext, organismeId: ObjectId): Promise<boolean> {
  const organisme = await getOrganismeById(organismeId);
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      return organisme._id.equals(organismeId);
    }

    case "TETE_DE_RESEAU":
      return (organisme.reseaux as string[])?.includes(organisation.reseau);

    case "DREETS":
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

export function isOrganisationOF(type: OrganisationType): boolean {
  return (
    type === "ORGANISME_FORMATION_FORMATEUR" ||
    type === "ORGANISME_FORMATION_RESPONSABLE" ||
    type === "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR"
  );
}

export async function canManageOrganismeEffectifs(ctx: AuthContext, organismeId: ObjectId): Promise<boolean> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const linkedOrganismesIds = await findOrganismesAccessiblesByOrganisationOF(
        ctx as AuthContext<OrganisationOrganismeFormation>
      );
      return linkedOrganismesIds.some((linkedOrganismesId) => linkedOrganismesId.equals(organismeId));
    }

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return true;

    default:
      return false;
  }
}

export async function requireManageOrganismeEffectifsPermission(
  ctx: AuthContext,
  organismeId: ObjectId
): Promise<void> {
  if (!(await canManageOrganismeEffectifs(ctx, organismeId))) {
    throw Boom.forbidden("Permissions invalides");
  }
}

/**
 * Restriction des effectifs selon un profil dans un contexte sans organismeId.
 */
export async function buildAggregatedRestriction(ctx: AuthContext, filters: FullEffectifsFilters) {
  return {
    // l'organisme doit être considéré comme fiable pour remonter des effectifs
    "_computed.organisme.fiable": true,

    $and: [
      // restrictions selon le profil
      await getIndicateursEffectifsRestrictionNew(ctx),

      // divers filtres en plus (notamment l'annee_scolaire, le département, etc)
      ...buildMongoFilters(filters, fullEffectifsFiltersConfigurations),
    ],
  };
}

/**
 * Restriction des effectifs selon un profil dans le contexte d'un organisme.
 */
export async function buildOrganismeRestriction(
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: FullEffectifsFilters
) {
  const organisme = await getOrganismeById(organismeId);
  const organismeCFDs = uniq(
    [
      ...(organisme.formationsFormateur ?? []),
      ...(organisme.formationsResponsable ?? []),
      ...(organisme.formationsResponsableFormateur ?? []),
    ].map((f) => f.cfd)
  );

  return {
    // effectifs agrégés organisme + formateurs
    organisme_id: {
      $in: [organismeId, ...findOrganismeFormateursIds(organisme)],
    },

    // l'organisme doit être considéré comme fiable pour remonter des effectifs
    "_computed.organisme.fiable": true,

    // les effectifs doivent être liés aux formations liées à l'organisme
    "formation.cfd": {
      $in: organismeCFDs,
    },

    $and: [
      // restrictions selon le profil
      await getOrganismeIndicateursEffectifsRestrictionNew(ctx, organisme),

      // divers filtres en plus (notamment l'annee_scolaire, le département, etc)
      ...buildMongoFilters(filters, fullEffectifsFiltersConfigurations),
    ],
  };
}

/**
 * Retourne un filtre mongo selon les permissions de l'utilisateur authentifié.
 * cf https://www.notion.so/mission-apprentissage/Permissions-afd9dc14606042e8b76b23aa57f516a8
 */
async function getIndicateursEffectifsRestrictionNew(ctx: AuthContext): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const userOrganisme = await organismesDb().findOne({
        siret: organisation.siret,
        uai: organisation.uai as string,
      });
      if (!userOrganisme) {
        logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
        throw new Error("organisme de l'organisation non trouvé");
      }

      return {
        $or: [
          // effectifs de l'OF liés aux formations dont l'OF est formateur ou responsable/formateur
          {
            organisme_id: userOrganisme._id,
            "formation.cfd": {
              $in: uniq(
                [
                  ...(userOrganisme.formationsFormateur ?? []),
                  ...(userOrganisme.formationsResponsableFormateur ?? []),
                ].map((f) => f.cfd)
              ),
            },
          },
          // effectifs des formateurs liés aux formation dont l'OF est responsable
          ...(userOrganisme.formationsResponsable ?? []).map((formationResponsable) => ({
            organisme_id: formationResponsable.organisme_formateur?.organisme_id,
            "formation.cfd": formationResponsable.cfd,
          })),
        ],
        // $or: [
        //   {
        //     organisme_id: userOrganisme._id,
        //     "formation.cfd": {
        //       $in: uniq([
        //         userOrganisme.formations
        //           ?.filter((f) => f.organisme_responsable?.organisme_id?.equals(userOrganisme._id))
        //           .map((f) => f.cfd),
        //       ]),
        //     },
        //   },
        //   {
        //     organisme_id: {
        //       $in: findOrganismeFormateursIds(userOrganisme),
        //     },
        //     "formation.cfd": {
        //       $in: uniq([
        //         userOrganisme.formations
        //           ?.filter((f) => f.organisme_responsable?.organisme_id?.equals(userOrganisme._id))
        //           .map((f) => f.cfd),
        //       ]),
        //     },

        //   }
        // ]
        // organisme_id: {
        //   $in: [userOrganisme._id, ...findOrganismeFormateursIds(userOrganisme)],
        // },
        // "formation.cfd": {
        //   $in: uniq(
        //     [
        //       ...(userOrganisme.formationsFormateur ?? []),
        //       ...(userOrganisme.formationsResponsable ?? []),
        //       ...(userOrganisme.formationsResponsableFormateur ?? []),
        //     ].map((f) => f.cfd)
        //   ),
        // },
      };
    }

    case "TETE_DE_RESEAU": {
      return {
        "_computed.organisme.reseaux": organisation.reseau,
        "formation.cfd": {
          [organisation.reseau === "AGRI" ? "$eq" : "$ne"]: /^..3/, // si CFD contient 3 en 3e caractère, alors réseau AGRI
        },
      };
    }

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return {
        "_computed.organisme.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "_computed.organisme.departement": organisation.code_departement,
      };
    case "ACADEMIE":
      return {
        "_computed.organisme.academie": organisation.code_academie,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

/**
 * Retourne un filtre mongo selon les permissions de l'utilisateur authentifié.
 * cf https://www.notion.so/mission-apprentissage/Permissions-afd9dc14606042e8b76b23aa57f516a8
 */
async function getOrganismeIndicateursEffectifsRestrictionNew(
  ctx: AuthContext,
  organisme: WithId<Organisme>
): Promise<any> {
  const organisation = ctx.organisation;
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const userOrganisme = await organismesDb().findOne({
        siret: organisation.siret,
        uai: organisation.uai as string,
      });
      if (!userOrganisme) {
        logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
        throw new Error("organisme de l'organisation non trouvé");
      }

      const userOrganismesFormateursIds = findOrganismeFormateursIds(userOrganisme);
      if (userOrganisme._id.equals(organisme._id)) {
        // OF cible
        return {
          $or: [
            // effectifs de l'OF liés aux formations dont l'OF est formateur ou responsable/formateur
            {
              organisme_id: userOrganisme._id,
              "formation.cfd": {
                $in: uniq(
                  [
                    ...(userOrganisme.formationsFormateur ?? []),
                    ...(userOrganisme.formationsResponsableFormateur ?? []),
                  ].map((f) => f.cfd)
                ),
              },
            },
            // effectifs des formateurs liés aux formation dont l'OF est responsable
            ...(userOrganisme.formationsResponsable ?? []).map((formationResponsable) => ({
              organisme_id: formationResponsable.organisme_formateur?.organisme_id,
              "formation.cfd": formationResponsable.cfd,
            })),
          ],
        };
      } else if (userOrganismesFormateursIds.some((id) => id.equals(organisme._id))) {
        // OF responsable
        return {
          organisme_id: {
            $in: [organisme._id],
          },
          // CFD en tant que responsable uniquement
          "formation.cfd": {
            $in: uniq([
              organisme.formationsFormateur
                ?.filter((f) => f.organisme_responsable?.organisme_id?.equals(userOrganisme._id))
                .map((f) => f.cfd),
            ]),
          },
        };
      }

      // pas de lien avec l'organisme
      return {
        _id: new ObjectId("000000000000"),
      };
    }

    case "TETE_DE_RESEAU": {
      let filtreDoubleReseaux: any;
      if (organisme.reseaux?.length === 2) {
        if (organisme.reseaux.includes("AGRI")) {
          filtreDoubleReseaux = {
            "formation.cfd": {
              [organisation.reseau === "AGRI" ? "$eq" : "$ne"]: /^..3/, // si CFD contient 3 en 3e caractère, alors réseau AGRI
            },
          };
        } else {
          // impossible de distinguer les formations d'un réseau pour l'instant
          logger.warn(
            {
              organisation_reseau: organisation.reseau,
              organisme_reseaux: organisme.reseaux,
              organisme_id: organisme._id.toString(),
            },
            "une tête de réseau ne peut voir un organisme avec 2 réseaux"
          );
          filtreDoubleReseaux = {
            _id: new ObjectId("000000000000"),
          };
        }
      }
      return {
        "_computed.organisme.reseaux": organisation.reseau,
        ...filtreDoubleReseaux,
      };
    }

    case "DREETS":
    case "DRAAF":
    case "CONSEIL_REGIONAL":
      return {
        "_computed.organisme.region": organisation.code_region,
      };
    case "DDETS":
      return {
        "_computed.organisme.departement": organisation.code_departement,
      };
    case "ACADEMIE":
      return {
        "_computed.organisme.academie": organisation.code_academie,
      };

    case "OPERATEUR_PUBLIC_NATIONAL":
    case "ADMINISTRATEUR":
      return {};
  }
}

import { type AnyBulkWriteOperation } from "mongodb";
import { SIRET_REGEX, UAI_REGEX } from "shared/constants";
import { zContactReferentiel, type IOrganisme } from "shared/models";
import { zAdresse } from "shared/models/parts/adresseSchema";
import { z } from "zod";

import { organismesDb } from "@/common/model/collections";

const relationOrganismeSchema = z
  .object({
    siret: z.string(),
    uai: z.string().nullable().optional(),
    _id: z.unknown().nullable().optional(),
    enseigne: z.string().nullish(),
    raison_sociale: z.string().optional(),
    commune: z.string().optional(),
    region: z.string().optional(),
    departement: z.string().optional(),
    academie: z.string().optional(),
    reseaux: z.array(z.string()).optional(),
    date_collecte: z.string().optional(),
    fiable: z.boolean().optional(),
    nature: z.string().optional(),
    last_transmission_date: z.date().nullish(),
    ferme: z.boolean().optional(),
    responsabilitePartielle: z.boolean().optional(),
  })
  .strict();

const zOrganisme = z
  .object({
    _id: z.unknown(),
    uai: z.string().optional(),
    siret: z.string().regex(SIRET_REGEX),
    opcos: z.array(z.string()).optional(),
    reseaux: z.array(z.string()).optional(),
    erps: z.array(z.string()).optional(),
    erp_unsupported: z.string().optional(),
    effectifs_count: z.number().int().optional(),
    effectifs_current_year_count: z.number().int().optional(),
    nature: z.string().optional(),
    nom: z.string().optional(),
    enseigne: z.string().nullish(),
    raison_sociale: z.string().optional(),
    adresse: zAdresse.optional(),
    relatedFormations: z
      .array(
        z
          .object({
            formation_id: z.unknown().optional(),
            cle_ministere_educatif: z.string().optional(),
            annee_formation: z.number().int().optional(),
            organismes: z
              .array(
                z
                  .object({
                    organisme_id: z.unknown().optional(),
                    nature: z.string().optional(),
                    uai: z.string().regex(UAI_REGEX).optional(),
                    siret: z.string().optional(),
                    adresse: zAdresse.optional(),
                  })
                  .strict()
              )
              .optional(),
            duree_formation_theorique: z.number().int().nullish(),
          })
          .strict()
      )
      .optional(),
    organismesFormateurs: z.array(relationOrganismeSchema).optional(),
    organismesResponsables: z.array(relationOrganismeSchema).optional(),
    first_transmission_date: z.date().optional(),
    last_transmission_date: z.date().optional(),
    est_dans_le_referentiel: z.string().optional(),
    ferme: z.boolean().optional(),
    qualiopi: z.boolean().optional(),
    contacts_from_referentiel: z.array(zContactReferentiel).optional(),
    // TODO [tech] TO REMOVE LATER
    access_token: z.string().optional(),
    api_key: z.string().optional(),
    api_uai: z.string().optional(),
    api_siret: z.string().optional(),
    api_configuration_date: z.date().optional(),
    api_version: z.string().nullable().optional(),

    fiabilisation_statut: z.string().optional(),
    fiabilisation_api_response: z.unknown().nullish(),
    mode_de_transmission: z.enum(["API", "MANUEL"]).optional(),
    mode_de_transmission_configuration_date: z.date().optional(),
    mode_de_transmission_configuration_author_fullname: z.string().optional(),
    organisme_transmetteur_id: z.string().optional(),
    updated_at: z.date(),
    created_at: z.date(),
    has_transmission_errors: z.boolean().optional(),
    transmission_errors_date: z.date().optional(),
    is_transmission_target: z.boolean().nullish(),
    last_effectifs_deca_update: z.date().optional(),
    last_erp_transmission_date: z.date().nullish(),
  })
  .strict();

export const up = async () => {
  const cursor = organismesDb().find({});

  let bulk: AnyBulkWriteOperation<IOrganisme>[] = [];
  for await (const organisme of cursor) {
    bulk.push({
      replaceOne: {
        filter: { _id: organisme._id },
        replacement: zOrganisme.parse(organisme) as IOrganisme,
      },
    });

    if (bulk.length > 1000) {
      await organismesDb().bulkWrite(bulk);
      bulk = [];
    }
  }

  if (bulk.length > 0) {
    await organismesDb().bulkWrite(bulk);
  }
};

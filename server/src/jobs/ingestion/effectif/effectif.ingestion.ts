import Boom from "boom";
import { formatISO } from "date-fns";
import { isEqual } from "lodash-es";
import { ObjectId } from "mongodb";
import type { IEffectifV2 } from "shared/models";
import type { IDossierApprenantSchemaV3 } from "shared/models/parts/dossierApprenantSchemaV3";

import { effectifV2Db } from "@/common/model/collections";
import { getEffectifCertification } from "@/jobs/fiabilisation/certification/fiabilisation-certification";

import { buildEffectifStatus } from "../status/effectif_status.builder";

export type IIngestEffectifUsedFields =
  | "annee_scolaire"
  | "id_erp_apprenant"
  | "date_inscription_formation"
  | "date_entree_formation"
  | "date_fin_formation"
  | "date_exclusion_formation"
  | "cause_exclusion_formation"
  | "date_obtention_diplome_formation"
  | "obtention_diplome_formation"
  | "contrat_date_debut"
  | "contrat_date_fin"
  | "contrat_date_rupture"
  | "cause_rupture_contrat"
  | "siret_employeur"
  | "contrat_date_debut_2"
  | "contrat_date_fin_2"
  | "contrat_date_rupture_2"
  | "cause_rupture_contrat_2"
  | "siret_employeur_2"
  | "contrat_date_debut_3"
  | "contrat_date_fin_3"
  | "contrat_date_rupture_3"
  | "cause_rupture_contrat_3"
  | "siret_employeur_3"
  | "contrat_date_debut_4"
  | "contrat_date_fin_4"
  | "contrat_date_rupture_4"
  | "cause_rupture_contrat_4"
  | "siret_employeur_4"
  | "rqth_apprenant"
  | "nom_referent_handicap_formation"
  | "prenom_referent_handicap_formation"
  | "email_referent_handicap_formation"
  | "email_contact"
  | "tel_apprenant"
  | "responsable_apprenant_mail1"
  | "responsable_apprenant_mail2"
  | "formation_cfd"
  | "formation_rncp";

export type IIngestEffectifV2Params = {
  dossier: Pick<IDossierApprenantSchemaV3, IIngestEffectifUsedFields>;
  adresse: IEffectifV2["adresse"];
  person_id: ObjectId;
  formation_id: ObjectId;
  date_transmission: Date;
};

function buildContrat(
  data: Pick<
    IDossierApprenantSchemaV3,
    | "contrat_date_debut"
    | "contrat_date_fin"
    | "contrat_date_rupture"
    | "cause_rupture_contrat"
    | "siret_employeur"
    | "contrat_date_debut_2"
  >
): IEffectifV2["contrats"][string] | null {
  if (data.contrat_date_debut == null) {
    return null;
  }

  return {
    date_debut: data.contrat_date_debut,
    date_fin: data.contrat_date_fin ?? null,

    rupture:
      data.contrat_date_rupture == null
        ? null
        : {
            cause: data.cause_rupture_contrat ?? null,
            date_rupture: data.contrat_date_rupture,
          },

    employeur: {
      siret: data.siret_employeur ?? null,
    },
  };
}

function getContrats(input: IIngestEffectifV2Params): IEffectifV2["contrats"][string][] {
  const contrats: IEffectifV2["contrats"][string][] = [];

  const contrat1 = buildContrat(input.dossier);
  const contrat2 = buildContrat({
    contrat_date_debut: input.dossier.contrat_date_debut_2,
    contrat_date_fin: input.dossier.contrat_date_fin_2,
    contrat_date_rupture: input.dossier.contrat_date_rupture_2,
    cause_rupture_contrat: input.dossier.cause_rupture_contrat_2,
    siret_employeur: input.dossier.siret_employeur_2,
  });
  const contrat3 = buildContrat({
    contrat_date_debut: input.dossier.contrat_date_debut_3,
    contrat_date_fin: input.dossier.contrat_date_fin_3,
    contrat_date_rupture: input.dossier.contrat_date_rupture_3,
    cause_rupture_contrat: input.dossier.cause_rupture_contrat_3,
    siret_employeur: input.dossier.siret_employeur_3,
  });
  const contrat4 = buildContrat({
    contrat_date_debut: input.dossier.contrat_date_debut_4,
    contrat_date_fin: input.dossier.contrat_date_fin_4,
    contrat_date_rupture: input.dossier.contrat_date_rupture_4,
    cause_rupture_contrat: input.dossier.cause_rupture_contrat_4,
    siret_employeur: input.dossier.siret_employeur_4,
  });

  if (contrat1 != null) {
    contrats.push(contrat1);
  }
  if (contrat2 != null) {
    contrats.push(contrat2);
  }
  if (contrat3 != null) {
    contrats.push(contrat3);
  }
  if (contrat4 != null) {
    contrats.push(contrat4);
  }

  return contrats;
}

type InvariantFields = "_id" | "identifiant";
type SpecialFields = "annee_scolaires" | "id_erp" | "contrats" | "_computed";

export async function ingestEffectifV2(input: IIngestEffectifV2Params): Promise<IEffectifV2> {
  const now = new Date();

  const invariantFields: Pick<IEffectifV2, InvariantFields> = {
    _id: new ObjectId(),
    identifiant: {
      person_id: input.person_id,
      formation_id: input.formation_id,
    },
  };

  const updateFields: Omit<IEffectifV2, SpecialFields | InvariantFields> = {
    date_inscription: input.dossier.date_inscription_formation,

    exclusion: input.dossier.date_exclusion_formation
      ? {
          // Convert empty string & undefined to null
          cause: input.dossier.cause_exclusion_formation || null,
          date: input.dossier.date_exclusion_formation,
        }
      : null,

    session: {
      debut: input.dossier.date_entree_formation,
      fin: input.dossier.date_fin_formation,
    },

    diplome:
      input.dossier.date_obtention_diplome_formation || input.dossier.obtention_diplome_formation != null
        ? {
            date: input.dossier.date_obtention_diplome_formation ?? null,
            obtention: input.dossier.obtention_diplome_formation ?? true,
          }
        : null,

    adresse: input.adresse,

    derniere_transmission: input.date_transmission,

    informations_personnelles: {
      rqth: input.dossier.rqth_apprenant ?? false,
      email: input.dossier.email_contact ?? null,
      telephone: input.dossier.tel_apprenant ?? null,
    },
    referent_handicap: {
      nom: input.dossier.nom_referent_handicap_formation ?? null,
      prenom: input.dossier.prenom_referent_handicap_formation ?? null,
      email: input.dossier.email_referent_handicap_formation ?? null,
    },

    responsable_apprenant: {
      email1: input.dossier.responsable_apprenant_mail1 ?? null,
      email2: input.dossier.responsable_apprenant_mail2 ?? null,
    },
  };

  const contrats = getContrats(input);
  const formation = await getEffectifCertification({
    cfd: input.dossier.formation_cfd ?? null,
    rncp: input.dossier.formation_rncp ?? null,
    date_entree: input.dossier.date_entree_formation ?? null,
    date_fin: input.dossier.date_fin_formation ?? null,
  });

  const computed: IEffectifV2["_computed"] = {
    statut: buildEffectifStatus(
      {
        session: updateFields.session,
        contrats: contrats.reduce((acc, contrat) => {
          acc[`${formatISO(contrat.date_debut, { representation: "date" })}`] = contrat;
          return acc;
        }, {}),
        exclusion: updateFields.exclusion,
      },
      new Date()
    ),
    session: formation ?? null,
  };

  const result = await effectifV2Db().findOneAndUpdate(
    {
      "identifiant.formation_id": invariantFields.identifiant.formation_id,
      "identifiant.person_id": invariantFields.identifiant.person_id,
    },
    {
      $setOnInsert: {
        ...invariantFields,
        ...(contrats.length === 0 ? { contrats: {} } : null),
      },
      $set: {
        ...updateFields,
        ...contrats.reduce((acc, contrat) => {
          acc[`contrats.${formatISO(contrat.date_debut, { representation: "date" })}`] = contrat;
          return acc;
        }, {}),
        _computed: computed,
      },
      $addToSet: {
        annee_scolaires: input.dossier.annee_scolaire,
        id_erp: input.dossier.id_erp_apprenant,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      includeResultMetadata: false,
    }
  );

  await updateComputedStatut(result!, now);

  return result!;
}

function getComputedStatutUpdateOp(effectif: IEffectifV2, now: Date) {
  const computedStatut = buildEffectifStatus(effectif, now);

  return isEqual(effectif._computed.statut, computedStatut) ? null : { $set: { "_computed.statut": computedStatut } };
}

export async function updateComputedStatut(effectif: IEffectifV2, now: Date) {
  let op = getComputedStatutUpdateOp(effectif, now);
  let counter = 0;
  while (op !== null && counter < 3) {
    const lastEffectif = await effectifV2Db().findOneAndUpdate({ _id: effectif._id }, op, {
      returnDocument: "after",
      includeResultMetadata: false,
    });
    if (!lastEffectif) {
      // The effectif has been deleted
      return;
    }

    op = getComputedStatutUpdateOp(lastEffectif, now);
    counter++;
  }

  if (op !== null) {
    throw Boom.internal("ensureStatutIsUpToDate: too many iterations", { effectifId: effectif._id });
  }
}

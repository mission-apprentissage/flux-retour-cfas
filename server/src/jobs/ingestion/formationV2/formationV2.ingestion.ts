import { ObjectId } from "bson";
import type { IFormationV2 } from "shared/models";
import type { IDossierApprenantSchemaV3 } from "shared/models/parts/dossierApprenantSchemaV3";

import { formationAPIV2Db, formationV2Db } from "@/common/model/collections";

import { findOrganismeWithStats } from "../process-ingestion";

export type IIngestFormationUsedFields =
  | "formation_cfd"
  | "formation_rncp"
  | "etablissement_responsable_siret"
  | "etablissement_responsable_uai"
  | "etablissement_formateur_siret"
  | "etablissement_formateur_uai"
  | "date_entree_formation"
  | "date_fin_formation";

export type IIngestFormationV2Params = Pick<IDossierApprenantSchemaV3, IIngestFormationUsedFields>;

export async function ingestFormationV2(dossier: IIngestFormationV2Params): Promise<IFormationV2> {
  if (!dossier.formation_cfd || !dossier.formation_rncp) {
    throw new Error("Impossible d'ingérer la formation : ni le cfd ni le rncp ne sont fournis");
  }

  const { organisme: organismeFormateur, stats: _statsFormateur } = await findOrganismeWithStats(
    dossier.etablissement_formateur_uai,
    dossier.etablissement_formateur_siret
  );
  const { organisme: organismeResponsable, stats: _statsResponsable } = await findOrganismeWithStats(
    dossier.etablissement_responsable_uai,
    dossier.etablissement_responsable_siret
  );

  const identifiant = {
    cfd: dossier.formation_cfd ?? null,
    rncp: dossier.formation_rncp ?? null,
    responsable_siret: dossier.etablissement_responsable_siret,
    responsable_uai: dossier.etablissement_responsable_uai,
    formateur_siret: dossier.etablissement_formateur_siret,
    formateur_uai: dossier.etablissement_formateur_uai,
  };

  const formationExisting = await formationV2Db().findOne({
    "identifiant.cfd": identifiant.cfd,
    "identifiant.rncp": identifiant.rncp,
    "identifiant.responsable_siret": identifiant.responsable_siret,
    "identifiant.responsable_uai": identifiant.responsable_uai,
    "identifiant.formateur_siret": identifiant.formateur_siret,
    "identifiant.formateur_uai": identifiant.formateur_uai,
  });

  if (formationExisting) {
    return formationExisting;
  }

  const { _id, ...apiFormation } = await formationAPIV2Db().findOne({
    "certification.valeur.identifiant.cfd": identifiant.cfd,
    "certification.valeur.identifiant.rncp": identifiant.rncp,
    "responsable.organisme?.identifiant.siret": organismeResponsable?.siret,
    "responsable.organisme?.identifiant.uai": organismeResponsable?.uai,
    "formateur.organisme?.identifiant.siret": organismeFormateur?.siret,
    "formateur.organisme?.identifiant.uai": organismeFormateur?.uai,
  });

  const data: IFormationV2 = {
    _id: new ObjectId(),
    identifiant: identifiant,
    draft: true,
    organisme_formateur_id: organismeFormateur?._id,
    organisme_responsable_id: organismeResponsable?._id,
    fiabilisation: {
      responsable_siret: organismeResponsable?.siret ?? null,
      responsable_uai: organismeResponsable?.uai ?? null,
      formateur_siret: organismeFormateur?.siret ?? null,
      formateur_uai: organismeFormateur?.uai ?? null,
    },
    computed: { formation: apiFormation },
  };

  const result = await formationV2Db().findOneAndUpdate(
    {
      "identifiant.cfd": data.identifiant.cfd,
      "identifiant.rncp": data.identifiant.rncp,
      "identifiant.responsable_siret": data.identifiant.responsable_siret,
      "identifiant.responsable_uai": data.identifiant.responsable_uai,
      "identifiant.formateur_siret": data.identifiant.formateur_siret,
      "identifiant.formateur_uai": data.identifiant.formateur_uai,
    },
    {
      $setOnInsert: {
        ...data,
      },
    },
    { upsert: true, returnDocument: "after", includeResultMetadata: false }
  );

  return result!;
}

import { ObjectId } from "bson";
import type { IFormationV2 } from "shared/models";
import type { IDossierApprenantSchemaV3 } from "shared/models/parts/dossierApprenantSchemaV3";

import { formationV2Db } from "@/common/model/collections";
import { getOrganismeByUAIAndSIRET } from "@/common/actions/organismes/organismes.actions";

export type IIngestFormationUsedFields =
  | "formation_cfd"
  | "formation_rncp"
  | "etablissement_responsable_siret"
  | "etablissement_responsable_uai"
  | "etablissement_formateur_siret"
  | "etablissement_formateur_uai";

export type IIngestFormationV2Params = Pick<IDossierApprenantSchemaV3, IIngestFormationUsedFields>;

export async function ingestFormationV2(dossier: IIngestFormationV2Params): Promise<IFormationV2> {
  const data: IFormationV2 = {
    _id: new ObjectId(),
    identifiant: {
      cfd: dossier.formation_cfd ?? null,
      rncp: dossier.formation_rncp ?? null,
      responsable_siret: dossier.etablissement_responsable_siret,
      responsable_uai: dossier.etablissement_responsable_uai,
      formateur_siret: dossier.etablissement_formateur_siret,
      formateur_uai: dossier.etablissement_formateur_uai,
    },
    draft: true,
  };



  const organismeFormateur = await getOrganismeByUAIAndSIRET(
    dossier.etablissement_formateur_uai,
    dossier.etablissement_formateur_siret
  );
  const organismeResponsable = await getOrganismeByUAIAndSIRET(
    dossier.etablissement_responsable_uai,
    dossier.etablissement_responsable_siret
  );

  const result = await formationV2Db().findOneAndUpdate(
    {
      "identifiant.cfd": data.identifiant.cfd,
      "identifiant.rncp": data.identifiant.rncp,
      "identifiant.responsable_siret": data.identifiant.responsable_siret,
      "identifiant.responsable_uai": data.identifiant.responsable_uai,
      "identifiant.formateur_siret": data.identifiant.formateur_siret,
      "identifiant.formateur_uai": data.identifiant.formateur_uai,
      organisme_formateur_id: organismeFormateur?._id,
      organisme_responsable_id: organismeResponsable?._id,
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

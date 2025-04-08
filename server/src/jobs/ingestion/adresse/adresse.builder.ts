import type { IEffectifV2 } from "shared/models";
import type { IDossierApprenantSchemaV3 } from "shared/models/parts/dossierApprenantSchemaV3";

import { getCommune } from "@/common/apis/apiAlternance/apiAlternance";

export type IIngestAdresseUsedFields = "adresse_apprenant" | "code_postal_apprenant" | "code_commune_insee_apprenant";

type IBuildAdresseParams = Pick<IDossierApprenantSchemaV3, IIngestAdresseUsedFields>;

export async function buildAdresse(dossier: IBuildAdresseParams): Promise<IEffectifV2["adresse"]> {
  const { code_postal_apprenant, code_commune_insee_apprenant } = dossier;

  if (code_postal_apprenant == null && code_commune_insee_apprenant == null) {
    return null;
  }

  const communeInfo = await getCommune({
    codeInsee: code_commune_insee_apprenant,
    codePostal: code_postal_apprenant,
  });

  if (communeInfo == null) {
    return null;
  }

  return {
    label: dossier.adresse_apprenant ?? null,
    code_postal: code_postal_apprenant ?? communeInfo.code.postaux[0],
    code_commune_insee: communeInfo.code.insee,
    commune: communeInfo.nom,
    code_academie: communeInfo.academie.code,
    code_departement: communeInfo.departement.codeInsee,
    code_region: communeInfo.region.codeInsee,
    mission_locale_id: communeInfo.mission_locale?.id ?? null,
    mission_locale_code: communeInfo.mission_locale?.code ?? null,
  };
}

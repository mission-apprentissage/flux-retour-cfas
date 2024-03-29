import { z, ZodIssueCode } from "zod";

import { DossierApprenantSchemaV3BaseWithApiDataType } from "./dossierApprenantSchemaV3";

export const validateContrat = (
  contrat: DossierApprenantSchemaV3BaseWithApiDataType,
  suffix: string,
  ctx: z.RefinementCtx
) => {
  const withSuffix = (str: string) => `${str}${suffix}`;
  const contrat_date_fin = withSuffix("contrat_date_fin");
  const cause_rupture_contrat = withSuffix("cause_rupture_contrat");
  const contrat_date_rupture = withSuffix("contrat_date_rupture");
  const contrat_date_debut = withSuffix("contrat_date_debut");

  if (
    (contrat[contrat_date_fin] || contrat[cause_rupture_contrat] || contrat[contrat_date_rupture]) &&
    !contrat[contrat_date_debut]
  ) {
    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: `Information de contrat incomplète : ${contrat_date_debut} manquant mais ce champ est renseigné`,
      path: [
        ...(contrat[contrat_date_fin] ? [contrat_date_fin] : []),
        ...(contrat[cause_rupture_contrat] ? [cause_rupture_contrat] : []),
        ...(contrat[contrat_date_rupture] ? [contrat_date_rupture] : []),
      ],
    });

    ctx.addIssue({
      code: ZodIssueCode.custom,
      message: `Information de contrat incomplète : ${contrat_date_fin}, ${cause_rupture_contrat} ou ${contrat_date_rupture} nécessite la présence de ${contrat_date_debut}`,
      path: [contrat_date_debut],
    });
  }
};

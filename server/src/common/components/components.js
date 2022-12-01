import createDossierApprenant from "./dossiersApprenants.js";
import createEffectifs from "./effectifs.js";

export default async (options = {}) => {
  const dossiersApprenants = options.dossiersApprenants || createDossierApprenant();
  const effectifs = options.effectifs || createEffectifs();

  return {
    dossiersApprenants,
    effectifs,
  };
};

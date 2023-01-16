import createDossierApprenant from "./dossiersApprenants.js";
import createEffectifs from "./effectifs.js";
import createEffectifsFromDossiers from "./effectifs.dossiers.js";

export default async (options = {}) => {
  const dossiersApprenants = options.dossiersApprenants || createDossierApprenant();
  const effectifs = options.effectifs || createEffectifs();
  const effectifsFromDossiers = options.effectifsFromDossiers || createEffectifsFromDossiers();

  return {
    dossiersApprenants,
    effectifs,
    effectifsFromDossiers,
  };
};

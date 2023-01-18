import createDossierApprenant from "./dossiersApprenants.js";
import createEffectifs from "./effectifs.js";
import createEffectifsFromDossiers from "./effectifs.dossiers.js";
import createEffectifsFromDossiersOld from "./effectifs.dossiers.old.js";

export default async (options = {}) => {
  const dossiersApprenants = options.dossiersApprenants || createDossierApprenant();
  const effectifs = options.effectifs || createEffectifs();
  const effectifsFromDossiers = options.effectifsFromDossiers || createEffectifsFromDossiers();
  const effectifsFromDossiersOld = options.effectifsFromDossiersOld || createEffectifsFromDossiersOld();

  return {
    dossiersApprenants,
    effectifs,
    effectifsFromDossiers,
    effectifsFromDossiersOld,
  };
};

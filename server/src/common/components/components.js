import createEffectifs from "./effectifs.js";
import createEffectifsFromDossiers from "./effectifs.dossiers.js";

export default async (options = {}) => {
  const effectifs = options.effectifs || createEffectifs();
  const effectifsFromDossiers = options.effectifsFromDossiers || createEffectifsFromDossiers();

  return {
    effectifs,
    effectifsFromDossiers,
  };
};

import createUsers from "./users.js";
import createDossierApprenant from "./dossiersApprenants.js";
import reseauxCfasComponent from "./reseauxCfas.js";
import createEffectifs from "./effectifs.js";

export default async (options = {}) => {
  const users = options.users || (await createUsers());
  const dossiersApprenants = options.dossiersApprenants || createDossierApprenant();
  const reseauxCfas = options.reseauxCfas || reseauxCfasComponent();
  const effectifs = options.effectifs || createEffectifs();

  return {
    users,
    dossiersApprenants,
    reseauxCfas,
    effectifs,
  };
};

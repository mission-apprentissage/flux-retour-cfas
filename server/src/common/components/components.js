import createUsers from "./users.js";
import createDossierApprenant from "./dossiersApprenants.js";
import cfasComponent from "./cfas.js";
import reseauxCfasComponent from "./reseauxCfas.js";
import createEffectifs from "./effectifs.js";

export default async (options = {}) => {
  const users = options.users || (await createUsers());
  const dossiersApprenants = options.dossiersApprenants || createDossierApprenant();
  const cfas = options.cfas || cfasComponent();
  const reseauxCfas = options.reseauxCfas || reseauxCfasComponent();
  const effectifs = options.effectifs || createEffectifs();

  return {
    users,
    dossiersApprenants,
    cfas,
    reseauxCfas,
    effectifs,
  };
};

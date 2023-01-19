import { apprenantCodePostalDeNaissanceControl } from "./apprenantCodePostalDeNaissance.control";
import { apprenantNouveauStatutControl } from "./apprenantNouveauStatut.control";
import { apprenantDernierOrganismeUaiControl } from "./apprenantUAI.control";
import { employeurSiretControl } from "./employeurSiret.control";

export const controls = [
  ...employeurSiretControl,
  ...apprenantNouveauStatutControl,
  ...apprenantDernierOrganismeUaiControl,
  ...apprenantCodePostalDeNaissanceControl,
];

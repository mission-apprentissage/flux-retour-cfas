import { employeurSiretControl } from "./employeurSiret.control";
import { idccControl } from "./idcc.control";
import { RemunerationsControl } from "./remunerations.control";
import { ContratDatesControl } from "./ContratDates.control";
import { ageApprentControl } from "./ageApprent.control";
import { avantagesNatureControl } from "./avantagesNature.control";
import { etablissementFormationControl } from "./etablissementFormation.control";
import { responsableLegalControl } from "./responsableLegal.control";
import { typeContratAppControl } from "./typeContratApp.control";
import { employeurCodePostalControl } from "./employeurCodePostal.control";
import { employeurNafControl } from "./employeurNaf.control";
import { typeDerogationControl } from "./typeDerogation.control";
import { maitresControl } from "./maitres.control";
import { rncpControl } from "./rncp.control";
import { codeDiplomeControl } from "./codeDiplome.control";
import { organismeFormationCodePostalControl } from "./organismeFormationCodePostal.control";
import { dateFormationControl } from "./dateFormation.control";
import { siretOrganismeFormationLogic } from "./organismeFormationSiret.control";
import { apprentiCodePostalControl } from "./apprentiCodePostal.control";
import { etablissementFormationSiretControl } from "./etablissementFormationSiret.control";
import { etablissementFormationCodePostalControl } from "./etablissementFormationCodePostal.control";
import { numeroContratPrecedentControl } from "./numeroContratPrecedent.control";
import { responsableLegalCodePostalControl } from "./responsableLegalCodePostal.control";
import { Maitre2Control } from "./maitre2.control";
import { dureeTravailControl } from "./dureeTravail.control";

export const controls = [
  ...dureeTravailControl,
  ...numeroContratPrecedentControl,
  ...etablissementFormationSiretControl,
  ...etablissementFormationCodePostalControl,
  ...organismeFormationCodePostalControl,
  ...apprentiCodePostalControl,
  ...employeurNafControl,
  ...employeurCodePostalControl,
  ...typeContratAppControl,
  ...avantagesNatureControl,
  ...etablissementFormationControl,
  responsableLegalCodePostalControl,
  ...responsableLegalControl,
  ...idccControl,
  ...employeurSiretControl,
  ...ContratDatesControl,
  ...dateFormationControl,
  siretOrganismeFormationLogic,
  ...maitresControl,
  Maitre2Control,
  ...ageApprentControl,
  ...typeDerogationControl,
  ...RemunerationsControl,
  ...rncpControl,
  ...codeDiplomeControl,
];

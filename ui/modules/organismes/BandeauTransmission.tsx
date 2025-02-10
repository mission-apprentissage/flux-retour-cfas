import { SystemProps, Text } from "@chakra-ui/react";
import { differenceInDays } from "date-fns";
import { IErp, TRANSMISSION_DONNEES_GROUP } from "shared";

import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";
import { useErp } from "@/hooks/useErp";

interface BandeauTransmissionProps {
  organisme: Organisme;
  modePublique?: boolean;
  modeIndicateurs?: boolean;
}

/**
 * Affiche un bandeau quand les effectifs ne sont pas encore transmis selon l'état de configuration ERP.
 */
function BandeauTransmission({
  organisme,
  modePublique,
  modeIndicateurs,
  ...props
}: BandeauTransmissionProps & SystemProps) {
  const { erpsById } = useErp();
  return (
    <Ribbons variant="alert" {...props}>
      <Text color="grey.800">
        {getContenuBandeauTransmission({ organisme, modePublique, modeIndicateurs, erpsById })}
      </Text>
    </Ribbons>
  );
}

export default BandeauTransmission;

function getContenuBandeauTransmission({
  organisme,
  modePublique,
  modeIndicateurs,
  erpsById,
}: BandeauTransmissionProps & { erpsById: Array<IErp> }): JSX.Element {
  const erpName = organisme.erps?.map((erpId) => erpsById[erpId]?.name).join(", "); // généralement 1 seul ERP

  if (modePublique) {
    return <>Cet établissement ne transmet pas encore ses effectifs au tableau de bord.</>;
  }

  if (!organisme.mode_de_transmission) {
    return (
      <>
        {modeIndicateurs ? "Les indicateurs sont nuls, car les " : "Les "}
        effectifs ne sont pas encore transmis. Votre CFA ou les organismes dont vous avez la gestion peuvent transmettre
        les effectifs. Si vous souhaitez démarrer le partage, cliquez sur “
        <Link href="/parametres" isUnderlined>
          paramétrer
        </Link>
        ” et laissez-vous guider. Le couple UAI/SIRET de chaque établissement doit être bien renseigné pour éviter les
        erreurs de transmission.
      </>
    );
  }

  if (organisme.mode_de_transmission === "API") {
    if (differenceInDays(new Date(), new Date(organisme.mode_de_transmission_configuration_date as string)) < 7) {
      return (
        <>
          Votre outil de gestion est {erpName}. Les {modeIndicateurs ? "indicateurs sont nuls" : "effectifs sont vides"}{" "}
          car l’importation de vos effectifs est en cours. Le tableau de bord recevra vos effectifs entre 24 et 48
          heures.
        </>
      );
    }

    return (
      <>
        Votre outil de gestion est {erpName}. Le tableau de bord ne reçoit pas vos effectifs. Veuillez vérifier à
        nouveau le paramétrage de votre ERP fait le{" "}
        {formatDateDayMonthYear(organisme.mode_de_transmission_configuration_date as string)}. En cas de difficultés,{" "}
        <Link variant="link" color="inherit" href={TRANSMISSION_DONNEES_GROUP} isExternal isUnderlined>
          contactez-nous
        </Link>{" "}
        pour obtenir de l’aide.
      </>
    );
  }

  return (
    <>
      Les {modeIndicateurs ? "indicateurs sont nuls" : "effectifs sont vides"} car votre établissement ne transmet pas
      encore ses effectifs.
    </>
  );
}

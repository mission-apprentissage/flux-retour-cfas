import { SystemProps, Text } from "@chakra-ui/react";
import { differenceInDays } from "date-fns";
import { ERPS_BY_ID } from "shared";

import { CONTACT_ADDRESS } from "@/common/constants/product";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";

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
  const erpName = organisme.erps?.map((erpId) => ERPS_BY_ID[erpId]?.name).join(", "); // généralement 1 seul ERP

  return (
    <Ribbons variant="warning" {...props}>
      <Text color="grey.800">
        {modePublique ? (
          "Cet établissement ne transmet pas encore ses effectifs au tableau de bord."
        ) : !organisme.mode_de_transmission ? (
          <>
            Les {modeIndicateurs ? "indicateurs sont nuls" : "effectifs sont vides"} car votre établissement ne transmet
            pas encore ses effectifs. Veuillez{" "}
            <Link href="/parametres" borderBottom="1px" _hover={{ textDecoration: "none" }}>
              paramétrer
            </Link>{" "}
            votre moyen de transmission.
          </>
        ) : organisme.mode_de_transmission === "API" ? (
          differenceInDays(new Date(organisme.mode_de_transmission_configuration_date as string), new Date()) < 7 ? (
            <>
              Votre outil de gestion est {erpName}. Les{" "}
              {modeIndicateurs ? "indicateurs sont nuls" : "effectifs sont vides"} car l’importation de vos effectifs
              est en cours. Le tableau de bord recevra vos effectifs entre 24 et 48 heures.
            </>
          ) : (
            <>
              Votre outil de gestion est {erpName}. Le tableau de bord ne reçoit pas vos effectifs. Veuillez vérifier à
              nouveau le paramétrage de votre ERP fait le{" "}
              {formatDateDayMonthYear(organisme.mode_de_transmission_configuration_date as string)}. En cas de
              difficultés,{" "}
              <Link
                variant="link"
                color="inherit"
                href={`mailto:${CONTACT_ADDRESS}?subject=Aide au paramétrage ERP`}
                isExternal
              >
                contactez-nous
              </Link>{" "}
              pour obtenir de l’aide.
            </>
          )
        ) : (
          <>
            Les {modeIndicateurs ? "indicateurs sont nuls" : "effectifs sont vides"} car votre établissement ne transmet
            pas encore ses effectifs.
          </>
        )}
      </Text>
    </Ribbons>
  );
}

{
  /* <Text fontSize="bold">
{ERPS_BY_ID[organisme.erps[0]]?.name} est votre moyen de transmission.
</Text>
<Text>
L’importation de vos effectifs est en cours. Le tableau de bord recevra vos effectifs entre 24-48
heures. Revenez plus tard pour consulter le tableau de vos effectifs.
</Text> */
}

export default BandeauTransmission;

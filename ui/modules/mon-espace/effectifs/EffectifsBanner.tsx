import { Image, VStack, Heading, Text, HStack } from "@chakra-ui/react";
import React from "react";

import { ERPS } from "@/common/constants/erps";
import { Organisme } from "@/common/internal/Organisme";
import { prettyPrintDate } from "@/common/utils/dateUtils";
import Section from "@/components/Section/Section";

type EffectifsBannerProps = {
  organisme: Partial<Organisme>;
  isMine: boolean;
};

const EffectifsBanner = ({ organisme, isMine }: EffectifsBannerProps) => {
  const erpId = organisme.erps?.[0];
  const mode_de_transmission = organisme.mode_de_transmission;
  const erpName = ERPS.find((erp) => erp.id === erpId?.toUpperCase())?.name;
  const prefixOrganismeText = isMine ? "Votre" : "Cet";
  // Legacy: pas de mode de transmission connu ni d'ERP configuré, mais une date de transmission.
  const legacy = !mode_de_transmission && !erpName && organisme.last_transmission_date;

  return (
    <Section
      borderTop="solid 1px"
      borderTopColor="grey.300"
      borderBottom="solid 1px"
      borderBottomColor="grey.300"
      backgroundColor="galt"
      paddingY={10}
    >
      <HStack justifyContent="space-between">
        <VStack alignItems="baseline" gap={4}>
          <Heading as="h2" fontSize="gamma" color="blue_cumulus_main">
            {legacy && `${prefixOrganismeText} organisme transmet ses effectifs`}
            {erpName && `${prefixOrganismeText} organisme transmet ses effectifs via ${erpName}`}
            {mode_de_transmission === "MANUEL" &&
              `${prefixOrganismeText} organisme transmet ses effectifs manuellement`}
          </Heading>
          <Text>
            {erpName &&
              `Dernière transmission de données par ${erpName} ${
                organisme.last_transmission_date
                  ? `le ${prettyPrintDate(organisme.last_transmission_date)}`
                  : "[en cours d'importation]"
              }.`}
            {legacy && `Dernière transmission de données le ${prettyPrintDate(organisme.last_transmission_date)}.`}
          </Text>
        </VStack>
        <Image src="/images/computer-woman.svg" alt="" />
      </HStack>
    </Section>
  );
};

export default EffectifsBanner;

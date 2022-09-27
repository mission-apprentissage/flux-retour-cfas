import { Heading, Text } from "@chakra-ui/react";
import { startOfHour } from "date-fns";
import React from "react";

import { Section } from "../../common/components";
import useFetchEffectifsNational from "../../common/hooks/useFetchEffectifsNational";
import { formatDateDayMonthYear } from "../../common/utils/dateUtils";
import IndicateursGridStack from "../app/visualiser-les-indicateurs/IndicateursGridStack";

const ApercuDonneesNational = () => {
  const date = startOfHour(new Date());
  const { data: effectifsNational, loading } = useFetchEffectifsNational(date);

  return (
    <Section paddingY="4w" color="grey.800" marginBottom="15w">
      <Heading as="h2" fontSize="gamma">
        Aperçu des données au national le {formatDateDayMonthYear(date)}
      </Heading>
      <Text marginTop="1w" marginBottom="2w" fontStyle="italic" color="grey.800">
        Ces chiffres ne reflètent pas la réalité des effectifs de l’apprentissage. <br />
        En période estivale les organismes de formation constituent les effectifs pour la rentrée suivante.
      </Text>
      <IndicateursGridStack
        effectifs={effectifsNational}
        organismesCount={effectifsNational?.totalOrganismes}
        loading={loading}
      />
    </Section>
  );
};

export default ApercuDonneesNational;

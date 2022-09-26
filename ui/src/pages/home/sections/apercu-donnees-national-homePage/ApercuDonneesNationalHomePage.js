import { Heading, Text } from "@chakra-ui/react";
import { startOfHour } from "date-fns";
import React from "react";

import useFetchEffectifsNational from "../../../../common/hooks/useFetchEffectifsNational";
import { formatDateDayMonthYear } from "../../../../common/utils/dateUtils";
import IndicateursGridStack from "../../../app/visualiser-les-indicateurs/IndicateursGridStack";

const ApercuDonneesNationalHomePage = () => {
  const date = startOfHour(new Date());
  const { data: effectifsNational, loading } = useFetchEffectifsNational(date);
  return (
    <>
      <Heading as="h2" fontSize="alpha" marginBottom="4w">
        Aperçu des données{" "}
        <Text as="span" fontSize="zeta" fontWeight="400">
          (Au niveau national en {formatDateDayMonthYear(date)})
        </Text>
      </Heading>
      <IndicateursGridStack
        effectifs={effectifsNational}
        organismesCount={effectifsNational.totalOrganismes}
        loading={loading}
      />
    </>
  );
};

export default ApercuDonneesNationalHomePage;

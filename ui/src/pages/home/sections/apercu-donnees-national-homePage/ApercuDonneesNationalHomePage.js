import { Box, Heading, Text } from "@chakra-ui/react";
import { startOfHour } from "date-fns";
import React from "react";

import { formatDateDayMonthYear } from "../../../../common/utils/dateUtils";
import IndicateursGridStack from "../../../app/visualiser-les-indicateurs/IndicateursGridStack";

const ApercuDonneesNationalHomePage = () => {
  const date = startOfHour(new Date());
  return (
    <Box paddingBottom="2w">
      <Heading as="h2" fontSize="alpha" marginBottom="4w">
        Aperçu des données{" "}
        <Text as="span" fontSize="zeta" fontWeight="400">
          (Au niveau national en {formatDateDayMonthYear(date)})
        </Text>
      </Heading>
      <IndicateursGridStack effectifs={2000} organismesCount={1000} />
    </Box>
  );
};

export default ApercuDonneesNationalHomePage;

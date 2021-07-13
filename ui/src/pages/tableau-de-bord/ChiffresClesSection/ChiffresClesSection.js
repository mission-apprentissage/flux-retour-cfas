import { Flex, Heading, Skeleton, Text } from "@chakra-ui/react";
import { endOfYear, startOfYear } from "date-fns";
import React, { useState } from "react";

import { Section } from "../../../common/components";
import AnneeSelector from "./AnneeSelector";
import { useFetchChiffresCles } from "./useFetchChiffresCles";

const SEPTEMBER_MONTH_INDEX = 8;
const getAcademicYearRange = () => {
  const startYear =
    new Date().getMonth() < SEPTEMBER_MONTH_INDEX ? new Date().getFullYear() - 1 : new Date().getFullYear();
  const start = new Date(startYear, SEPTEMBER_MONTH_INDEX, 1); // 1st day of September of computed year
  const end = new Date();
  return [start, end];
};

const ANNEE_OPTIONS = [
  { value: getAcademicYearRange(), label: "sur l'année scolaire 2020-2021" },
  { value: [startOfYear(new Date()), endOfYear(new Date())], label: "sur l'année civile 2021" },
];

const ChiffresClesSection = () => {
  const [selectedAnnee, setSelectedAnnee] = useState(ANNEE_OPTIONS[0]);
  const [data, loading] = useFetchChiffresCles(selectedAnnee.value);

  let content = null;

  if (loading) {
    content = <Skeleton startColor="grey.800" endColor="grey.200" width="25rem" height="1rem" />;
  } else if (data) {
    content = (
      <>
        <strong>{data.nbContrats} nouveaux contrats d&apos;apprentissages ont été signés</strong>, et{" "}
        <strong>{data.nbRuptures} ruptures enregistrées</strong>
      </>
    );
  }

  return (
    <Section paddingY="2w">
      <Heading as="h2" textStyle="h2">
        Chiffres clés
      </Heading>
      <Flex alignItems="center" marginTop="1w">
        <AnneeSelector options={ANNEE_OPTIONS} selectedAnnee={selectedAnnee} setSelectedAnnee={setSelectedAnnee} />
        <Text color="grey.800" marginLeft="3v" fontSize="gamma">
          {content}
        </Text>
      </Flex>
    </Section>
  );
};

export default ChiffresClesSection;

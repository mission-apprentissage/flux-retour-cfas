import React from "react";
import { useRouter } from "next/router";
import { Box, Text, Radio, RadioGroup, Stack } from "@chakra-ui/react";
import SearchBySIRETForm from "./components/SearchBySIRETForm";
import SearchByUAIForm from "./components/SearchByUAIForm";
import { InscriptionOrganistionChildProps } from "./common";

type TypeOfSearch = "siret" | "uai" | undefined;

export const InscriptionOF = ({ organisation, setOrganisation }: InscriptionOrganistionChildProps) => {
  const router = useRouter();
  const typeOfSearch = router.query.select as TypeOfSearch;

  function setTypeOfSearch(type: string) {
    router.push(`/auth/inscription/organisme_formation?select=${type}`);
    setOrganisation(null);
  }

  return (
    <Box>
      <Text fontWeight="bold">Vous êtes un CFA ou organisme de formation.</Text>
      <Box mt="2w">
        <Text fontSize={15}>Au choix, indiquez l’UAI ou le SIRET de votre établissement :</Text>
        <RadioGroup onChange={setTypeOfSearch} value={typeOfSearch} mt={3}>
          <Stack direction="row">
            <Radio value="uai">UAI</Radio>
            <Radio value="siret">SIRET</Radio>
          </Stack>
        </RadioGroup>
      </Box>
      {typeOfSearch === "siret" && <SearchBySIRETForm organisation={organisation} setOrganisation={setOrganisation} />}
      {typeOfSearch === "uai" && <SearchByUAIForm organisation={organisation} setOrganisation={setOrganisation} />}
    </Box>
  );
};

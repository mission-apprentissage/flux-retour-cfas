import React from "react";
import NavLink from "next/link";
import { useRouter } from "next/router";
import { Box, Text, Radio, RadioGroup, Stack, Flex, Link } from "@chakra-ui/react";
import { SiretBlock } from "./components/SiretBlock";
import { UaiBlock } from "./components/UaiBlock";

type TypeOfSearch = "siret" | "uai" | undefined;

export const InscriptionOF = ({ onEtablissementSelected }) => {
  const router = useRouter();
  const typeOfSearch = router.query.select as TypeOfSearch;

  function setTypeOfSearch(type: string) {
    router.push(`/auth/inscription/organisme_formation?select=${type}`);
  }

  return (
    <Box>
      <Text fontWeight="bold">Vous êtes un CFA ou organisme de formation.</Text>
      <Box mt="2w">
        <Text fontSize={15}>Au choix, indiquez l’UAI ou SIRET de votre établissement :</Text>
        <RadioGroup onChange={setTypeOfSearch} value={typeOfSearch} mt={3}>
          <Stack direction="row">
            <Radio value="uai">UAI</Radio>
            <Radio value="siret">SIRET</Radio>
          </Stack>
        </RadioGroup>
      </Box>
      {typeOfSearch === "siret" && <SiretBlock onSiretFetched={onEtablissementSelected} organismeFormation />}
      {typeOfSearch === "uai" && <UaiBlock onUaiFetched={onEtablissementSelected} />}

      <Flex flexGrow={1} mb={8}>
        <Text mt={8} fontSize="1rem">
          <Link
            borderBottom="1px solid"
            as={NavLink}
            href="/auth/inscription/organisme-inconnu"
            color="bluefrance"
            _hover={{ textDecoration: "none" }}
          >
            Je ne connais ni mon UAI ni mon Siret
          </Link>
        </Text>
      </Flex>
    </Box>
  );
};

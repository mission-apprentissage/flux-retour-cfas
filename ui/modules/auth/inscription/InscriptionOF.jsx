import React, { useState } from "react";
import NavLink from "next/link";
import { Box, Text, Radio, RadioGroup, Stack, Flex, Link } from "@chakra-ui/react";
import { SiretBlock } from "./components/SiretBlock";
import { UaiBlock } from "./components/UaiBlock";

export const InscriptionOF = ({ onEndOfSpecific }) => {
  const [typeOfSearch, setTypeOfSearch] = useState("");
  const [help, setHelp] = useState("");

  return (
    <Box>
      {!typeOfSearch && help === "" && (
        <>
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
        </>
      )}
      {typeOfSearch === "siret" && help === "" && <SiretBlock onSiretFetched={onEndOfSpecific} organismeFormation />}
      {typeOfSearch === "uai" && help === "" && <UaiBlock onUaiFetched={onEndOfSpecific} />}

      {typeOfSearch === "" && help === "" && (
        <Flex flexGrow={1} mb={8}>
          <Text mt={8} fontSize="1rem">
            <Link
              href="#"
              borderBottom="1px solid"
              as={NavLink}
              onClick={() => setHelp("dontKnowMyUaiNorMySiret")}
              color="bluefrance"
              _hover={{ textDecoration: "none" }}
            >
              Je ne connais ni mon UAI ni mon Siret
            </Link>
          </Text>
        </Flex>
      )}
      {help === "dontKnowMyUaiNorMySiret" && (
        <Box mt="2w">
          <Text fontWeight={700}>Vous ne connaissez ni l’UAI ni le Siret de votre organisme.</Text>
          <Text>
            Vous pouvez le retrouver facilement en consultant le{" "}
            <Link
              href={`https://referentiel.apprentissage.onisep.fr/`}
              fontWeight={700}
              color="bluefrance"
              whiteSpace="nowrap"
            >
              Référentiel{" "}
            </Link>
            de l’apprentissage ou{" "}
            <Link
              href={`https://annuaire-entreprises.data.gouv.fr/`}
              fontWeight={700}
              color="bluefrance"
              whiteSpace="nowrap"
            >
              l’Annuaire{" "}
            </Link>
            des entreprises. Vous pouvez aussi consulter la{" "}
            <Link
              href={`https://www.notion.so/Documentation-dbb1eddc954441eaa0ba7f5c6404bdc0`}
              fontWeight={700}
              color="bluefrance"
              whiteSpace="nowrap"
            >
              FAQ
            </Link>{" "}
            du tableau de bord.
          </Text>
          <br />
          <Link
            onClick={() => {
              setHelp("");
              setTypeOfSearch("");
            }}
            color="bluefrance"
            borderBottom="1px solid"
            _hover={{ cursor: "pointer", textDecoration: "none", borderBottom: "2px solid" }}
          >
            Retour à l’étape précédente
          </Link>
        </Box>
      )}
    </Box>
  );
};

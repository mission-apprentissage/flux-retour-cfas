import { Box, Text, Tooltip } from "@chakra-ui/react";
import React from "react";

import Link from "@/components/Links/Link";

const NatureOrganismeDeFormationWarning = () => {
  return (
    <Tooltip
      minWidth={350}
      label={
        <>
          <Text fontWeight="700">Attention !</Text>
          <Text marginTop="1w">L&apos;UAI ou le SIRET de l&apos;organisme n&apos;ont pu être vérifiés.</Text>
          <Text marginTop="1w">
            Afin de nous aider à corriger et fiabiliser ces données, nous vous remercions de bien vouloir vous
            rapprocher de l&apos;organisme concerné afin de l&apos;inviter à vérifier et/ou corriger ces données dans
            son logiciel de gestion. En cas de doute, vous pouvez également nous contacter :
          </Text>
          <Link href="mailto:tableau-de-bord@apprentissage.beta.gouv.fr" color="bluefrance" whiteSpace="nowrap">
            tableau-de-bord@apprentissage.beta.gouv.fr
          </Link>
        </>
      }
      aria-label="A tooltip"
      color="grey.800"
      background="white"
      padding="3w"
      placement="right-end"
    >
      <Box as="i" fontSize="delta" className="ri-alert-fill" color="warning" />
    </Tooltip>
  );
};

export default NatureOrganismeDeFormationWarning;

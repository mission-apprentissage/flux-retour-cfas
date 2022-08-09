import { Box, Text, Tooltip } from "@chakra-ui/react";
import React from "react";

const NatureOrganismeDeFormationWarning = () => {
  return (
    <Tooltip
      label={
        <>
          <Text fontWeight="700">Attention !</Text>
          <Text marginTop="1w">
            La nature de l&apos;organisme est déduite du couple UAI-SIRET. Or ce couple n&apos;a pas été retrouvé à
            l&apos;identifique dans le Référentiel.
          </Text>
          <Text marginTop="1w">
            Afin de nous aider à fiabiliser les données, vous pouvez contacter l&apos;organisme concerné pour lui
            demander de vérifier et/ou corriger ces données dans son ERP ou logiciel de gestion. En cas de doute, vous
            pouvez également nous contacter.
          </Text>
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

import { Box, Text, Tooltip } from "@chakra-ui/react";
import React from "react";

const TooltipNatureOf = () => {
  return (
    <Tooltip
      label={
        <>
          <Text fontWeight="700">Relations entre les organismes</Text>
          <Text marginTop="1w">
            Les relations entre les organismes sont identifiées via le Catalogue des formations en apprentissage (base
            des Carif-Oref) Elles sont identifiées au niveau de l&apos;offre de formation en apprentissage collectée par
            les Carif-Oref. En effet, chaque offre de formation est associée à un organisme responsable et un organisme
            formateur (chacun est connu par son SIRET et son UAI le cas échéant).
          </Text>
          <Text marginTop="1w">
            Si les organismes associés à une offre de formation ont le même SIRET, on en déduit la nature
            &quot;responsable et formateur&quot; et on ne génère pas de relation.
          </Text>
          <Text marginTop="1w">
            Si les organismes associés à une offre de formation n&apos;ont pas le même SIRET, on en déduit la nature
            &quot;responsable&quot; pour l&apos;un et &quot;formateur&quot; pour l&apos;autre, et on génère une relation
            entre eux.
          </Text>
          <Text marginTop="1w">
            Si cette donnée est inconnue ou incorrecte, voir la marche à suivre sur
            https://referentiel.apprentissage.onisep.fr/corrections?item=relations
          </Text>
        </>
      }
      aria-label="A tooltip"
      color="grey.800"
      background="white"
      padding="3w"
      placement="right-end"
    >
      <Box as="i" fontSize="delta" className="ri-information-line" color="info" />
    </Tooltip>
  );
};

export default TooltipNatureOf;

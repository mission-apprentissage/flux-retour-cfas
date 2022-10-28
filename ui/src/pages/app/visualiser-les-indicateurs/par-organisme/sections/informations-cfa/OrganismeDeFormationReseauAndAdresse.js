import { Box, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const OrganismeDeFormationReseauAndAdresse = ({ reseaux, adresse, multipleSirets, nbEtablissements }) => {
  const hasReseaux = reseaux.length > 1;
  const reseauxSliced = reseaux.slice(1, reseaux.length);
  const getOrganismeReseaux = () => (
    <HStack>
      <Text>
        Cet organisme fait partie du réseau <strong>{reseaux[0]}</strong>{" "}
      </Text>
      {reseauxSliced?.map((item, index) => {
        return (
          <Text key={index}>
            et du réseau <strong>{item}</strong>
          </Text>
        );
      })}
    </HStack>
  );

  return (
    <Box fontSize="epsilon" textColor="grey.800" marginTop="3w">
      {hasReseaux && getOrganismeReseaux()}
      {hasReseaux && adresse ? `Sa domiciliation est ${adresse}.` : ""}
      {!hasReseaux && adresse && <Text>La domiciliation de cet organisme est {adresse}</Text>}
      {multipleSirets && <strong> Il est identifié par une UAI qui utilise {nbEtablissements} numéros SIRET.</strong>}
    </Box>
  );
};

OrganismeDeFormationReseauAndAdresse.propTypes = {
  reseaux: PropTypes.array,
  adresse: PropTypes.string,
  multipleSirets: PropTypes.bool,
  nbEtablissements: PropTypes.number,
};
export default OrganismeDeFormationReseauAndAdresse;

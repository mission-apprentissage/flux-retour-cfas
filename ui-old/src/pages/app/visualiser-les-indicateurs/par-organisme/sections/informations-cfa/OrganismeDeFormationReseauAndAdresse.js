import { Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

const OrganismeDeFormationReseauAndAdresse = ({ reseaux, adresse, multipleSirets, nbEtablissements }) => {
  const hasReseaux = reseaux?.length > 0;
  const getOrganismeReseauxAndAdresseText = () => {
    if (hasReseaux) {
      return (
        <>
          Cet organisme fait partie du réseau <strong>{reseaux[0]}</strong>{" "}
          {reseaux.slice(1, reseaux.length)?.map((item) => (
            <>
              et du réseau <strong>{item}</strong>
            </>
          ))}
          . {adresse ? `Sa domiciliation est ${adresse}.` : ""}
        </>
      );
    } else {
      if (adresse) {
        return <>La domiciliation de cet organisme est {adresse}</>;
      }
      return null;
    }
  };

  return (
    <Text fontSize="epsilon" textColor="grey.800" marginTop="3w">
      {getOrganismeReseauxAndAdresseText()}
      {multipleSirets && <strong> Il est identifié par une UAI qui utilise {nbEtablissements} numéros SIRET.</strong>}
    </Text>
  );
};

OrganismeDeFormationReseauAndAdresse.propTypes = {
  reseaux: PropTypes.array,
  adresse: PropTypes.string,
  multipleSirets: PropTypes.bool,
  nbEtablissements: PropTypes.number,
};
export default OrganismeDeFormationReseauAndAdresse;

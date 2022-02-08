import { Box, Heading, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Highlight } from "../../../../../../common/components";
import { pluralize } from "../../../../../../common/utils/stringUtils";
import { infosCfaPropType } from "../../propTypes";
import CfaInformationSkeleton from "./CfaInformationSkeleton";
import DomainesMetiers from "./DomainesMetiers";

const CfaInformationSection = ({ infosCfa, loading, error }) => {
  if (loading) {
    return <CfaInformationSkeleton />;
  }

  if (error) {
    return (
      <Text fontSize="epsilon" color="white">
        <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
        <Box as="span" verticalAlign="middle">
          Erreur lors de la récupération des informations de l&apos;organisme de formation
        </Box>
      </Text>
    );
  }

  if (infosCfa) {
    const { uai, sousEtablissements, libelleLong, reseaux, adresse, domainesMetiers } = infosCfa;
    return (
      <Highlight>
        <Text color="white" fontSize="omega">
          UAI&nbsp;:&nbsp;{uai} - {sousEtablissements.length} {pluralize("SIRET", sousEtablissements.length, "S")} pour
          cet organisme
        </Text>
        <Heading color="white" fontSize="gamma" marginTop="1w">
          {libelleLong}
        </Heading>
        <Text color="white" marginTop="1w">
          {adresse}
        </Text>
        {reseaux?.length > 0 && (
          <Text color="white">
            Réseau(x)&nbsp;:&nbsp;
            {reseaux.join(", ")}
          </Text>
        )}
        {domainesMetiers && <DomainesMetiers domainesMetiers={domainesMetiers} />}
      </Highlight>
    );
  }

  return null;
};

CfaInformationSection.propTypes = {
  infosCfa: infosCfaPropType,
  loading: PropTypes.bool,
  error: PropTypes.object,
};

export default CfaInformationSection;

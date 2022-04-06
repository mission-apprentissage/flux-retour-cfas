import { Badge, Box, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../../../../common/components";
import { formatSiretSplitted } from "../../../../../../common/utils/stringUtils";
import { infosCfaPropType } from "../../propTypes";
import CfaInformationSkeleton from "./CfaInformationSkeleton";
import DomainesMetiers from "./DomainesMetiers";

const ReseauxAndAdresseText = ({ reseaux, adresse }) => {
  const hasReseaux = reseaux?.length > 0;
  if (hasReseaux) {
    if (adresse) {
      return (
        <Text fontSize="epsilon" textColor="grey.800" marginTop="3w">
          Cet organisme fait partie du réseau <b>{reseaux[0]}</b>. Sa domiciliation est {adresse}.
        </Text>
      );
    }
    return (
      <Text fontSize="epsilon" textColor="grey.800" marginTop="3w">
        Cet organisme fait partie du réseau <b>{reseaux[0]}</b>.
      </Text>
    );
  } else {
    if (adresse) {
      return (
        <Text fontSize="epsilon" textColor="grey.800" marginTop="3w">
          La domiciliation de cet organisme est {adresse}
        </Text>
      );
    }
    return "";
  }
};

ReseauxAndAdresseText.propTypes = {
  reseaux: PropTypes.array,
  adresse: PropTypes.string,
};

const CfaInformationSection = ({ infosCfa, loading, error }) => {
  if (loading) {
    return <CfaInformationSkeleton />;
  }

  if (error) {
    return (
      <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
        <Text fontSize="epsilon" color="black">
          <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
          <Box as="span" verticalAlign="middle">
            Erreur lors de la récupération des informations de l&apos;organisme de formation
          </Box>
        </Text>
      </Section>
    );
  }

  if (infosCfa) {
    const { uai, sousEtablissements, reseaux, adresse, domainesMetiers } = infosCfa;
    const multipleSirets = sousEtablissements.length > 1;
    const siretToDisplay = sousEtablissements[0]?.siret_etablissement
      ? formatSiretSplitted(sousEtablissements[0]?.siret_etablissement)
      : "N/A";

    return (
      <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
        <HStack fontSize="epsilon" textColor="grey.800" spacing="2w">
          <HStack>
            <Text marginBottom="2px">UAI :</Text>
            <Badge fontSize="epsilon" textColor="grey.800" paddingX="1v" paddingY="2px" backgroundColor="#ECEAE3">
              {uai}
            </Badge>
          </HStack>
          {!multipleSirets && (
            <HStack>
              <Text marginBottom="2px">SIRET :</Text>
              <Badge fontSize="epsilon" textColor="grey.800" paddingX="1v" paddingY="2px" backgroundColor="#ECEAE3">
                {siretToDisplay}
              </Badge>
            </HStack>
          )}
        </HStack>

        <ReseauxAndAdresseText reseaux={reseaux} adresse={adresse} />
        {multipleSirets && (
          <strong>Il est identifié par une UAI qui utilise {sousEtablissements.length} numéros SIRET.</strong>
        )}

        {domainesMetiers?.length > 0 && <DomainesMetiers domainesMetiers={domainesMetiers} />}
      </Section>
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

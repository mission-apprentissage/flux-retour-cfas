import { Badge, Box, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import { Section } from "../../../../../../common/components";
import { formatSiretSplitted } from "../../../../../../common/utils/stringUtils";
import { infosCfaPropType } from "../../propTypes";
import CfaInformationSkeleton from "./CfaInformationSkeleton";
import DomainesMetiers from "./DomainesMetiers";

const ReseauxAndAdresseText = ({ reseaux, adresse, multipleSirets, nbEtablissements }) => {
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

ReseauxAndAdresseText.propTypes = {
  reseaux: PropTypes.array,
  adresse: PropTypes.string,
  multipleSirets: PropTypes.bool,
  nbEtablissements: PropTypes.number,
};

const CfaInformationSection = ({ infosCfa, loading, error, isUserCfa = false }) => {
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
    const { uai, sousEtablissements, reseaux, adresse, domainesMetiers, libelleLong } = infosCfa;
    const multipleSirets = sousEtablissements.length > 1;
    const siretToDisplay = sousEtablissements[0]?.siret_etablissement
      ? formatSiretSplitted(sousEtablissements[0]?.siret_etablissement)
      : "N/A";

    return (
      <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
        <HStack fontSize="epsilon" textColor="grey.800" spacing="2w">
          <HStack>
            {isUserCfa && (
              <>
                <Text marginBottom="2px">Organisme :</Text>
                <Badge fontSize="epsilon" textColor="grey.800" paddingX="1v" paddingY="2px" backgroundColor="#ECEAE3">
                  {libelleLong}
                </Badge>
              </>
            )}
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

        <ReseauxAndAdresseText
          reseaux={reseaux}
          adresse={adresse}
          multipleSirets={multipleSirets}
          nbEtablissements={sousEtablissements.length}
        />

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
  isUserCfa: PropTypes.bool,
};

export default CfaInformationSection;

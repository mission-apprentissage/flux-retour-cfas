import { Badge, Box, HStack, Link, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import TooltipNatureOf from "../../../../../../common/components/NatureOrganismeDeFormationWarning/NatureOrganismeDeFormationWarning";
import { REFERENTIEL_CORRECTION_URL } from "../../../../../../common/constants/product.js";
import { formatSiretSplitted } from "../../../../../../common/utils/stringUtils";
import { infosCfaPropType } from "../../propTypes";
import CfaInformationSkeleton from "./CfaInformationSkeleton";
import DomainesMetiers from "./DomainesMetiers";
import OrganismeDeFormationReseauAndAdresse from "./OrganismeDeFormationReseauAndAdresse";

export const mapNatureOrganismeDeFormation = (nature) => {
  switch (nature) {
    case "responsable":
      return "Responsable";
    case "formateur":
      return "Formateur";
    case "responsable_formateur":
      return "Responsable et formateur";
    default:
      return "Inconnue";
  }
};

const CfaInformationSection = ({ infosCfa, loading, error, ...props }) => {
  if (loading) {
    return <CfaInformationSkeleton />;
  }

  if (error) {
    return (
      <Text fontSize="epsilon" color="black">
        <Box as="i" className="ri-error-warning-fill" verticalAlign="middle" marginRight="1v" />
        <Box as="span" verticalAlign="middle">
          Erreur lors de la récupération des informations de l&apos;organisme de formation
        </Box>
      </Text>
    );
  }

  if (infosCfa) {
    const { uai, sousEtablissements, nature, reseaux, adresse, domainesMetiers, libelleLong } = infosCfa;
    const multipleSirets = sousEtablissements.length > 1;
    const siretToDisplay = sousEtablissements[0]?.siret_etablissement
      ? formatSiretSplitted(sousEtablissements[0]?.siret_etablissement)
      : "N/A";

    return (
      <Box {...props} marginBottom={!multipleSirets ? "85px" : ""}>
        <Text color="#6A6AF4" fontWeight="bold" fontSize="20px">
          {libelleLong}
        </Text>
        <Text color="black" fontWeight="bold" fontSize="beta">
          Bienvenue sur votre espace Tableau de Bord
        </Text>
        <Text color="grey.800" fontSize="20px">
          Votre espace vous permet de visualiser en un temps réel vos effectifs d’apprentis au sein de votre centre ou
          organisme de formation, afin de permettre aux pouvoirs publics de piloter au mieux la politique de
          l’apprentissage nationalement et localement.
        </Text>
        <HStack marginTop="3w" fontSize="epsilon" textColor="grey.800" spacing="2w">
          <HStack>
            <Text>UAI :</Text>
            <Badge fontSize="epsilon" textColor="grey.800" paddingX="1w" paddingY="2px" backgroundColor="#ECEAE3">
              {uai}
            </Badge>
          </HStack>
          {!multipleSirets && (
            <HStack>
              <Text>SIRET :</Text>
              <Badge fontSize="epsilon" textColor="grey.800" paddingX="1w" paddingY="2px" backgroundColor="#ECEAE3">
                {siretToDisplay}
              </Badge>
            </HStack>
          )}
          <HStack>
            <Text>Nature :</Text>
            <Badge
              fontSize="epsilon"
              textTransform="none"
              textColor="grey.800"
              paddingX="1w"
              paddingY="2px"
              backgroundColor="#ECEAE3"
            >
              {mapNatureOrganismeDeFormation(nature)}
            </Badge>
            <TooltipNatureOf />
          </HStack>
        </HStack>
        <OrganismeDeFormationReseauAndAdresse
          reseaux={reseaux}
          adresse={adresse}
          multipleSirets={multipleSirets}
          nbEtablissements={sousEtablissements.length}
        />

        {domainesMetiers?.length > 0 && <DomainesMetiers domainesMetiers={domainesMetiers} />}

        <Link target="_blank" href={REFERENTIEL_CORRECTION_URL} color="bluefrance" whiteSpace="nowrap">
          <HStack>
            <Text>Signaler un changement</Text>
            <Box marginTop="2w" className="ri-arrow-right-line" />
          </HStack>
        </Link>
      </Box>
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

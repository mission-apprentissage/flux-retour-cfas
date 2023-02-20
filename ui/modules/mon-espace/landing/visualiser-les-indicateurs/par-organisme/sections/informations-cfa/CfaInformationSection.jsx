import { Badge, Box, HStack, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";

import Section from "@/components/Section/Section";
import NatureOrganismeDeFormationWarning from "@/components/NatureOrganismeDeFormationWarning/NatureOrganismeDeFormationWarning";
import { formatSiretSplitted } from "@/common/utils/stringUtils";
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
    const { uai, sousEtablissements, nature, nature_validity_warning, reseaux, adresse, domainesMetiers } = infosCfa;
    const multipleSirets = sousEtablissements.length > 1;
    const siretToDisplay = sousEtablissements[0]?.siret_etablissement
      ? formatSiretSplitted(sousEtablissements[0]?.siret_etablissement)
      : "N/A";

    return (
      <Section
        borderTop="solid 1px"
        borderTopColor="grey.300"
        borderBottom="solid 1px"
        borderBottomColor="grey.300"
        backgroundColor="galt"
        paddingY="2w"
      >
        <Box marginBottom={!multipleSirets ? "85px" : ""}>
          <HStack fontSize="epsilon" textColor="grey.800" spacing="2w">
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
              {nature_validity_warning && <NatureOrganismeDeFormationWarning />}
            </HStack>
          </HStack>
          <OrganismeDeFormationReseauAndAdresse
            reseaux={reseaux}
            adresse={adresse}
            multipleSirets={multipleSirets}
            nbEtablissements={sousEtablissements.length}
          />

          {domainesMetiers?.length > 0 && <DomainesMetiers domainesMetiers={domainesMetiers} />}
        </Box>
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

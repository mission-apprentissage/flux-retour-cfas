import React from "react";
import {
  Badge,
  Box,
  Heading,
  HStack,
  ListItem,
  Skeleton,
  Text,
  Tooltip,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";

import Section from "@/components/Section/Section";
import Ribbons from "@/components/Ribbons/Ribbons";
import NatureOrganismeDeFormationWarning from "@/components/NatureOrganismeDeFormationWarning/NatureOrganismeDeFormationWarning";
import { TETE_DE_RESEAUX_BY_ID } from "@/common/constants/networksConstants";
import IndicateursInfos from "../../common/IndicateursInfos";
import { SimpleFiltersProvider } from "../../common/SimpleFiltersContext";
import { Organisme } from "@/common/internal/Organisme";

export const natureOrganismeDeFormationLabel = {
  responsable: "Responsable",
  formateur: "Formateur",
  responsable_formateur: "Responsable et formateur",
  inconnue: "Inconnue",
};

export const natureOrganismeDeFormationTooltip = {
  responsable: (
    <>
      <Text>Organismes responsables</Text>
      <UnorderedList mt={4}>
        <ListItem>
          Ne dispense pas de formation mais délègue à des organismes responsable et formateur ou uniquement formateur ;
        </ListItem>
        <ListItem>
          Est signataire de la convention de formation ; Demande et reçoit les financements de l{"'"}OPCO ;
        </ListItem>
        <ListItem>Est responsable auprès de l{"'"}administration du respect de ses missions et obligations ;</ListItem>
        <ListItem>
          Est titulaire de la certification qualité en tant que CFA et est garant du respect des critères qualité au
          sein de l{"'"}UFA.
        </ListItem>
      </UnorderedList>
    </>
  ),
  formateur: (
    <>
      <Text>Organismes formateurs</Text>
      <UnorderedList mt={4}>
        <ListItem>
          Dispense des actions de formation par apprentissage déclaré auprès des services de l{"'"}Etat (n° de
          déclaration d{"'"}activité (NDA))
        </ListItem>
      </UnorderedList>
    </>
  ),
  responsable_formateur: (
    <>
      <Text>Organismes responsables et formateurs</Text>
      <UnorderedList mt={4}>
        <ListItem>
          Dispense des actions de formation par apprentissage déclaré auprès des services de l{"'"}Etat (n° de
          déclaration d{"'"}activité (NDA)) - Est signataire de la convention de formation ;
        </ListItem>
        <ListItem>Demande et reçoit les financements de l{"'"}OPCO ;</ListItem>
        <ListItem>Est responsable auprès de l{"'"}administration du respect de ses missions et obligations ;</ListItem>
        <ListItem>
          Est titulaire de la certification qualité en tant que CFA et est garant du respect des critères qualité au
          sein de l{"'"}UFA.
        </ListItem>
      </UnorderedList>
    </>
  ),
};

export default function OrganismeInfo({ organisme, isMine }: { organisme: Organisme; isMine: boolean }) {
  if (!organisme) {
    return (
      <Section borderTop="solid 1px" borderTopColor="grey.300" backgroundColor="galt" paddingY="2w">
        <Skeleton height="2rem" width="250px" marginBottom="2w" />
        <Skeleton height="3rem" width="100%" />
      </Section>
    );
  }

  return (
    <>
      <Section
        borderTop="solid 1px"
        borderTopColor="grey.300"
        borderBottom="solid 1px"
        borderBottomColor="grey.300"
        backgroundColor="galt"
        paddingY="2w"
        mt={4}
        mb={4}
      >
        <Box>
          <Heading color="grey.800" fontSize="1.6rem" as="h3" mb={2}>
            {organisme.enseigne || organisme.raison_sociale}
          </Heading>
          <HStack fontSize="epsilon" textColor="grey.800" spacing="2w">
            <HStack>
              <Text>UAI :</Text>
              <Badge fontSize="epsilon" textColor="grey.800" paddingX="1w" paddingY="2px" backgroundColor="#ECEAE3">
                {organisme.uai || "UAI INCONNUE"}
              </Badge>
            </HStack>

            <HStack>
              <Text>SIRET :</Text>
              <Badge fontSize="epsilon" textColor="grey.800" paddingX="1w" paddingY="2px" backgroundColor="#ECEAE3">
                {organisme.siret || "SIRET INCONNU"}
              </Badge>
            </HStack>

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
                {natureOrganismeDeFormationLabel[organisme.nature] || "Inconnue"}
              </Badge>
              {natureOrganismeDeFormationTooltip[organisme.nature] && (
                <Tooltip
                  background="bluefrance"
                  color="white"
                  label={<Box padding="2w">{natureOrganismeDeFormationTooltip[organisme.nature]}</Box>}
                  aria-label={natureOrganismeDeFormationTooltip[organisme.nature]}
                >
                  <Box
                    as="i"
                    className="ri-information-line"
                    fontSize="epsilon"
                    color="grey.500"
                    marginLeft="1w"
                    verticalAlign="middle"
                  />
                </Tooltip>
              )}
              {organisme.nature_validity_warning && <NatureOrganismeDeFormationWarning />}
            </HStack>
          </HStack>

          <VStack mt={10} alignItems={"baseline"}>
            {organisme.reseaux && organisme.reseaux?.length > 0 && (
              <Text>
                Cet organisme fait partie {organisme.reseaux?.length === 1 ? "du réseau" : "des réseaux"}{" "}
                <b>{organisme.reseaux.map((reseau) => TETE_DE_RESEAUX_BY_ID[reseau]?.nom)?.join(", ")}</b>
              </Text>
            )}
            {organisme.adresse?.complete && <Text>Sa domiciliation est : {organisme.adresse.complete}</Text>}
          </VStack>

          {organisme.ferme && (
            <Ribbons variant="alert" mt={10}>
              <Box ml={3}>
                <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                  Ce siret est connu comme correspondant à un établissement fermé.
                </Text>
              </Box>
            </Ribbons>
          )}
        </Box>
      </Section>

      <Box mt={5}>
        {!(organisme.first_transmission_date || organisme.mode_de_transmission) && (
          <Ribbons variant="warning" mt="0.5rem">
            <Box ml={3}>
              <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                {isMine
                  ? 'Vous ne nous transmettez pas encore vos effectifs. Veuillez cliquer dans l’onglet "Mes effectifs" pour démarrer l’import.'
                  : "Cet organisme ne nous transmet pas encore ses effectifs."}
              </Text>
            </Box>
          </Ribbons>
        )}
        {!organisme.first_transmission_date && organisme.mode_de_transmission && (
          <Ribbons variant="warning" mt="0.5rem">
            <Box ml={3}>
              <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                {isMine
                  ? "Vos effectifs sont en cours de transmission."
                  : "Les effectifs de cet organisme sont en cours de transmission."}
              </Text>
            </Box>
          </Ribbons>
        )}
      </Box>
      <Ribbons variant="info">
        <Box ml={3}>
          <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
            Service d’import de vos effectifs en version bêta.
          </Text>
          <Text color="grey.800" mt={4} textStyle="sm">
            Nous listons actuellement toutes les informations qui peuvent empêcher l{"'"}import de fichier afin de
            permettre par la suite une meilleure prise en charge de tout type de fichier.
          </Text>
        </Box>
      </Ribbons>
      {organisme.first_transmission_date && (
        <SimpleFiltersProvider>
          <IndicateursInfos organismeId={organisme._id} />
        </SimpleFiltersProvider>
      )}
    </>
  );
}

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
import { useQuery } from "@tanstack/react-query";

import { TETE_DE_RESEAUX_BY_ID } from "@/common/constants/networks";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import NatureOrganismeDeFormationWarning from "@/components/NatureOrganismeDeFormationWarning/NatureOrganismeDeFormationWarning";
import Ribbons from "@/components/Ribbons/Ribbons";
import Section from "@/components/Section/Section";
import IndicateursGrid from "@/modules/dashboard/IndicateursGrid";
import { IndicateursEffectifs } from "@/modules/models/indicateurs";

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
  const { data: indicateurs, isLoading: indicateursLoading } = useQuery<IndicateursEffectifs>(
    ["organismes", organisme?._id, "indicateurs"],
    () =>
      _get(`/api/v1/organismes/${organisme._id}/indicateurs`, {
        params: {
          date: new Date(),
        },
      }),
    {
      enabled: !!organisme?._id,
    }
  );

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
              <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                Ce siret est connu comme correspondant à un établissement fermé.
              </Text>
            </Ribbons>
          )}
        </Box>
      </Section>

      <Box mt={5}>
        {!(organisme.first_transmission_date || organisme.mode_de_transmission) && (
          <Ribbons variant="warning" mt="0.5rem">
            <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
              {isMine
                ? 'Vous ne nous transmettez pas encore vos effectifs. Veuillez cliquer dans l’onglet "Mes effectifs" pour démarrer l’import.'
                : "Cet organisme ne nous transmet pas encore ses effectifs."}
            </Text>
          </Ribbons>
        )}
        {!organisme.first_transmission_date && organisme.mode_de_transmission && (
          <Ribbons variant="warning" mt="0.5rem">
            <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
              {isMine
                ? "Vos effectifs sont en cours de transmission."
                : "Les effectifs de cet organisme sont en cours de transmission."}
            </Text>
          </Ribbons>
        )}
      </Box>
      {indicateurs && <IndicateursGrid indicateursEffectifs={indicateurs} loading={indicateursLoading} />}
    </>
  );
}

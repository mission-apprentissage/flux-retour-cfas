import { Box, Flex, FormLabel, HStack, Link, ListItem, Text, UnorderedList, VStack } from "@chakra-ui/react";
import React from "react";
import { useRecoilValue } from "recoil";
import { valuesSelector } from "../../../../formEngine/atoms";
import { InputController } from "../../../../formEngine/components/Input/InputController";
import { CollapseController } from "../../../../formEngine/components/CollapseController";
import { shouldShowRemunerationsAnnuelles } from "../domain/shouldShowRemunerationsAnnuelles";
import Ribbons from "../../../../../../components/Ribbons/Ribbons";
import { ExternalLinkLine } from "../../../../../../theme/components/icons";

const getAnneeLabel = (ordre) => {
  return {
    1.1: "1ère Année, du",
    2.1: "2ère Année, du",
    3.1: "3ère Année, du",
    4.1: "4ème année, du",
  }[ordre];
};

export const Remunerations = () => {
  const values = useRecoilValue(valuesSelector);
  const dateDebutContrat = values.contrat.dateDebutContrat;
  const dateFinContrat = values.contrat.dateFinContrat;
  const apprentiDateNaissance = values.apprenti.dateNaissance;
  const employeurAdresseDepartement = values.employeur.adresse.departement;
  const smic = values.contrat.smic;
  const remunerationsAnnuelles = values.contrat.remunerationsAnnuelles;

  return (
    <Box borderColor={"dgalt"} borderWidth={2} px={4} py={4} borderStyle="dashed" rounded="xl">
      <FormLabel fontWeight={700} fontSize="1.3rem">
        Rémunération
      </FormLabel>
      <Ribbons variant="info_clear" marginTop="1rem">
        <Text color="grey.800">
          Le calcul de la rémunération est généré automatiquement à partir des informations <br />
          que vous avez remplies. <br />
          <strong>
            Le calcul indique la rémunération minimale légale, l&apos;employeur pouvant décider d&apos;attribuer
            <br /> une rémunération plus avantageuse.
          </strong>
        </Text>
      </Ribbons>
      <Ribbons variant="alert_clear" marginTop="0.5rem">
        <Text color="grey.800">
          <strong>Attention : Ne tient pas encore compte de situations spécifiques</strong>
          <br />
          <Text as="span" textStyle="xs" fontStyle="italic">
            Exemples : rémunération du contrat d&apos;apprentissage préparant à une licence professionnelle, majorations{" "}
            <br />
          </Text>
          <Text as="span" textStyle="xs">
            En savoir plus sur les situations spécifiques sur le{" "}
            <Link
              color="bluefrance"
              textDecoration="underline"
              isExternal
              href="https://travail-emploi.gouv.fr/formation-professionnelle/formation-en-alternance-10751/apprentissage/contrat-apprentissage#salaire"
            >
              site du Ministère du Travail, de l&apos;Emploi et de l&apos;Insertion
              <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
            </Link>
          </Text>
        </Text>
      </Ribbons>

      {(dateDebutContrat === "" ||
        dateFinContrat === "" ||
        apprentiDateNaissance === "" ||
        employeurAdresseDepartement === "") && (
        <VStack alignItems="flex-start" color="mgalt" mt={3}>
          <Text>
            L&apos;outil détermine les périodes de rémunération et s&apos;assure du respect du minimum légale pour
            chacune des périodes, à partir des éléments renseignés.
          </Text>
          <UnorderedList ml="30px !important">
            <ListItem fontWeight="400" fontStyle="italic" color={apprentiDateNaissance === "" ? "error" : "green.500"}>
              La date de naissance de l&apos;apprenti
            </ListItem>
            <ListItem fontWeight="400" fontStyle="italic" color={dateDebutContrat === "" ? "error" : "green.500"}>
              La date de début d&apos;exécution du contrat
            </ListItem>
            <ListItem fontWeight="400" fontStyle="italic" color={dateFinContrat === "" ? "error" : "green.500"}>
              La date de fin du contrat
            </ListItem>
            <ListItem
              fontWeight="400"
              fontStyle="italic"
              color={employeurAdresseDepartement === "" ? "error" : "green.500"}
            >
              Le département de l&apos;employeur
            </ListItem>
          </UnorderedList>
        </VStack>
      )}
      <CollapseController show={shouldShowRemunerationsAnnuelles}>
        <Box>
          {remunerationsAnnuelles?.map((annee, i) => {
            const anneeLabel = getAnneeLabel(annee.ordre);
            return (
              <Box key={i} mt={anneeLabel ? 6 : 5}>
                {anneeLabel && (
                  <Box fontSize="1.1rem" fontWeight="bold" mb={1}>
                    {anneeLabel}
                  </Box>
                )}
                <HStack spacing={2} key={i} alignItems="flex-end">
                  <InputController name={`contrat.remunerationsAnnuelles[${i}].dateDebut`} mb={0} />
                  <Box mt="1.7rem !important">au</Box>
                  <InputController name={`contrat.remunerationsAnnuelles[${i}].dateFin`} />
                  <InputController name={`contrat.remunerationsAnnuelles[${i}].taux`} />
                  <Box w="100%" position="relative" fontStyle="italic" color="disablegrey" pl={2}>
                    soit {annee.salaireBrut} € / mois. <br />
                    Seuil minimal légal {annee.tauxMinimal} %
                  </Box>
                </HStack>
              </Box>
            );
          })}
        </Box>
        <Flex mt={5}>
          <Box w="55%" flex="1">
            <InputController name="contrat.salaireEmbauche" />
          </Box>
        </Flex>
        <Flex color="grey.600">
          {!smic?.isSmicException && (
            <Text>
              Calculé sur la base du SMIC {smic?.annee} de {smic?.selectedSmic}€ mensuel ({smic?.heuresHebdomadaires}
              €/h) [Date d&apos;entrée en vigueur {smic?.dateEntreeEnVigueur}]
            </Text>
          )}
          {smic?.isSmicException && (
            <Text>
              Calculé sur la base du SMIC {smic?.annee} pour{" "}
              <strong>{smic?.exceptions[employeurAdresseDepartement]?.nomDepartement}</strong> de {smic?.selectedSmic}€
              mensuel ({smic?.exceptions[employeurAdresseDepartement]?.heuresHebdomadaires}
              €/h) [Date d&apos;entrée en vigueur {smic?.dateEntreeEnVigueur}]
            </Text>
          )}
        </Flex>
      </CollapseController>
    </Box>
  );
};

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Radio,
  RadioGroup,
  Text,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Tooltip,
  useToast,
  VStack,
} from "@chakra-ui/react";
import get from "lodash.get";
import uniq from "lodash.uniq";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useState } from "react";
import { useSetRecoilState } from "recoil";

import { _get, _post, _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { BaseAccordionGroup } from "@/components/BaseAccordionGroup/BaseAccordionGroup";
import Ribbons from "@/components/Ribbons/Ribbons";
import Stepper from "@/components/Stepper/Stepper";
import useOpenApi from "@/hooks/useOpenApi";
import useServerEvents from "@/hooks/useServerEvents";
import useUploadAnalyser from "@/hooks/useUploadAnalyser";

const FieldMapping = ({ fields, openApiSpecs }) => {
  return (
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Informations demandées</Th>
            <Th>Données attendues</Th>
            <Th>En-têtes des colonnes (fichier importé)</Th>
            <Th>3 premières lignes de données</Th>
          </Tr>
        </Thead>
        <Tbody backgroundColor="white">
          {openApiSpecs &&
            fields?.map((fieldPath) => {
              const fieldDef = get(openApiSpecs, fieldPath);

              if (!fieldDef) {
                return (
                  <Tr key={fieldPath}>
                    <Td colSpan={4}>{fieldPath}</Td>
                  </Tr>
                );
              }
              const [parentPath, field] = fieldPath.split(".");
              const parentDef = get(openApiSpecs, parentPath);
              const isRequired = parentDef?.required.includes(field);
              return (
                <Tr key={fieldPath}>
                  <Td>
                    {fieldDef.description}
                    {isRequired && " * "}
                  </Td>
                  <Td color="mgalt">ex: {fieldDef.example}</Td>
                  <Td>{fieldDef.description}</Td>
                  <Td>Ici apparaitra un aperçu des données sur votre fichier</Td>
                </Tr>
              );
            })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const TeleversementsMapping = ({ organisme }: { organisme: Organisme }) => {
  const data = useUploadAnalyser(organisme._id);
  const { data: openApiSpecs } = useOpenApi();

  const toast = useToast();
  const sections = [
    {
      title: "Identification des apprenants (obligatoire)",
      intro: "Cette étape permet d’identifier vos apprenants et de les répartir dans vos formations",
      fields: ["apprenant.nom", "apprenant.prenom", "formation.annee_scolaire", "formation.code_cfd"],
    },
    {
      title: "Données complémentaires des apprenants",
      intro: "Cette étape permet ....",
      fields: ["apprenant.courriel", "apprenant.sexe", "apprenant.sexe", "apprenant.date_de_naissance"],
    },
    {
      title: "Situations de vos apprenants en formation",
      intro: "Cette étape permet ....",
    },
    {
      title: "Situations de vos apprenants en entreprise",
      intro: "Cette étape permet ....",
    },
    {
      title: "Situations de vos apprenants en entreprise après une 1ère rupture",
      intro: "Cette étape permet ....",
    },
    {
      title: "Situations de vos apprenants en entreprise après une 2eme rupture",
      intro: "Cette étape permet ....",
    },
  ];

  return (
    <>
      <Flex width="100%" justify="flex-start" mt={5} mb={10} flexDirection="column">
        <Stepper
          title="Faire correspondre les intitulés de colonne"
          nextTitle="Vérification des données avant importation"
          currentStep={1}
          maxStep={4}
          paddingBottom={10}
        />

        <Accordion marginTop="2w" allowMultiple fontFamily="Marianne">
          {sections.map((item, index) => (
            <AccordionItem key={index}>
              <AccordionButton
                flex={1}
                color="bluefrances.main"
                fontWeight="bold"
                border="solid 1px"
                borderColor="bluefrance_light2"
                justifyContent="space-between"
                fontSize="md"
                _expanded={{ bg: "bluefrance_light2" }}
              >
                {item.title}
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel paddingBottom={4} bgColor="bluefrance_light2">
                <Text>{item.intro}</Text>
                <FieldMapping fields={item.fields} openApiSpecs={openApiSpecs} />
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
        {JSON.stringify(data, null, 2)}
      </Flex>
    </>
  );
};

export default TeleversementsMapping;

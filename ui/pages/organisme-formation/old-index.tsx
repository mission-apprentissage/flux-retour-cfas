import { Box, Heading, HStack, Link, Text } from "@chakra-ui/react";
import Head from "next/head";
import React, { Fragment } from "react";

import { ERPS } from "@/common/constants/erps";
import { CONTACT_ADDRESS } from "@/common/constants/product";
import LinkCard from "@/components/LinkCard/LinkCard";
import Page from "@/components/Page/Page";
import Section from "@/components/Section/Section";
import AcquisitionCfaBarGraph from "@/modules/organisme-formation/AcquisitionCfaBarGraph";
import { Checkbox } from "@/theme/components/icons";

export default function OrganismeFormation() {
  const title = "Vous êtes un organisme de formation";
  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section>
        <Heading textStyle="h2" color="grey.800" mt={5}>
          Vous êtes un organisme de formation
        </Heading>
      </Section>
      <Section>
        <Text fontSize="gamma" marginTop="1w">
          Le tableau de bord de l’apprentissage expose automatiquement les données <br />
          provenant de votre logiciel de gestion une fois que vous en avez donné <br />
          l’autorisation.
        </Text>
        <HStack
          spacing={["0", "0", "0", "0", "3w"]}
          flexDirection={["column", "column", "column", "column", "row"]}
          marginTop="2w"
        >
          <LinkCard variant="white" linkHref="/organisme-formation/transmettre">
            Comment transmettre les <br />
            données de votre organisme ?
          </LinkCard>
          <LinkCard
            my={["2w !important", "2w !important", "2w !important", "2w !important", "0"]}
            variant="white"
            linkHref="/organisme-formation/consulter"
          >
            Comment consulter et vérifier les données que vous transmettez ?
          </LinkCard>
          <LinkCard variant="white" linkHref="/questions-reponses">
            Une question ? Besoin d’aide ? <br />
            Consulter la page d’aide
          </LinkCard>
        </HStack>
      </Section>

      <Section mb={["8w", "8w", "8w", "0", "0"]}>
        <Heading as="h3" fontSize="beta">
          Organismes de formation et logiciels de gestion interfacés
        </Heading>
        <Text color="grey.800" marginTop="3w">
          <strong>
            L&apos;équipe du tableau de bord travaille conjointement avec les acteurs publics locaux des politiques de
            l&apos;apprentissage pour faire connaître le tableau de bord de l’apprentissage sur l&apos;ensemble du
            territoire.
          </strong>
          <br />
          Parallèlement les développements nécessaires sont menés avec les ERP et pour vous permettre de transmettre
          sans logiciel spécifique. Si votre ERP n&apos;est pas dans la liste ci-dessous ou si vous avez des questions,{" "}
          <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
            contactez-nous.
          </Link>
        </Text>
        <HStack
          spacing={["0", "0", "0", "0", "3w"]}
          flexDirection={["column", "column", "column", "column", "row"]}
          marginY="6w"
          alignItems={["start", "start", "start", "start", "center"]}
          display={["none", "none", "none", "flex", "flex"]}
        >
          <Box paddingY="3w" paddingX="4w" background="galt" flex="3">
            <Heading as="h4" fontSize="gamma">
              Organismes de formation qui transmettent leurs données
            </Heading>
            <Box height="260px">
              <AcquisitionCfaBarGraph />
            </Box>
          </Box>
          <Box
            paddingY="3w"
            mt={["2w !important", "2w !important", "2w !important", "2w !important", "0"]}
            paddingX="4w"
            background="galt"
            display={["flex", "flex", "flex", "flex", "block"]}
            flexDirection="column"
            w="100%"
            minWidth={["100%", "100%", "100%", "100%", "300px"]}
            flex="1"
          >
            <Box marginTop="3v">
              <HStack
                spacing={["2w", "2w", "2w", "2w", "0"]}
                alignItems="start"
                flexDirection={["row", "row", "row", "row", "column"]}
              >
                <Text color="grey.600" fontWeight="700" fontSize="epsilon">
                  Interfacés :
                </Text>
                {ERPS.map(({ name, state }) => {
                  return (
                    <Fragment key={name}>
                      {state !== "coming" && (
                        <Box fontSize="epsilon" color="grey.800" alignItems="center">
                          <Checkbox color="#03053D" />
                          <Text marginLeft="1w" as="span">
                            <strong>
                              {name}
                              {state === "ongoing" && <Text as="span"> (en cours)</Text>}
                            </strong>
                          </Text>
                        </Box>
                      )}
                    </Fragment>
                  );
                })}
              </HStack>
            </Box>
            <Box marginTop="3v">
              <HStack
                spacing={["2w", "2w", "2w", "2w", "0"]}
                alignItems="start"
                flexDirection={["row", "row", "row", "row", "column"]}
              >
                <Text color="grey.600" fontWeight={700} fontSize="epsilon">
                  À venir :
                </Text>
                {ERPS.map(({ name, state }) => {
                  return (
                    <Fragment key={name}>
                      {state === "coming" && (
                        <Box fontSize="epsilon" color="grey.800" alignItems="center" marginLeft="1v">
                          <Checkbox
                            color="white"
                            bg="white"
                            border="2px solid"
                            borderColor="#03053D"
                            borderRadius="20px"
                          />
                          <Text marginLeft="1w" as="span">
                            <strong>{name}</strong>
                          </Text>
                        </Box>
                      )}
                    </Fragment>
                  );
                })}
              </HStack>
            </Box>
          </Box>
        </HStack>
      </Section>
    </Page>
  );
}

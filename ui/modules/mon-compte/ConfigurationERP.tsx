import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Heading, Button, Text, List, ListItem, VStack, Input, Box, Flex, ListIcon, HStack } from "@chakra-ui/react";
import React, { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import ErpTutorial from "@/components/ErpTutorial/ErpTutorial";
import Ribbons from "@/components/Ribbons/Ribbons";
import Table from "@/components/Table/Table";
import useToaster from "@/hooks/useToaster";
import { Checkbox } from "@/theme/components/icons";

type ConfigurationERPProps = {
  organisme: Organisme;
  erp: string | undefined | string[];
  isGenerating: boolean;
  onGenerate: () => Promise<string>;
};

const DynamicList = ({ apiKey, copied, verified }) => {
  const Item = ({ children, active = false }) => {
    return (
      <ListItem {...(active ? { color: "bluefrance", fontWeight: "bold" } : { ml: 6 })}>
        {active && <ListIcon as={ArrowForwardIcon} color="bluefrance" />}
        {children}
      </ListItem>
    );
  };
  return (
    <List color="#3A3A3A" my={3}>
      <Item active={!apiKey}>1. Générer la clé en cliquant sur le bouton ci-dessous</Item>
      <Item active={!copied && apiKey && !verified}>2. Copier la clé</Item>
      <Item active={copied && apiKey && !verified}>3. Retourner dans votre compte ERP pour la coller</Item>
      <Item active={apiKey && copied && !verified}>
        4. Finaliser en confirmant l’UAI et SIRET de votre établissement
      </Item>
    </List>
  );
};

const ConfigurationERP = ({ erp, onGenerate, isGenerating, organisme }: ConfigurationERPProps) => {
  const { toastSuccess, toastError } = useToaster();
  const [copied, setCopied] = useState(false);
  const [verified] = useState(!!organisme.api_siret && !!organisme.api_uai);

  return (
    <Flex w="100%" color="#1E1E1E" alignItems="baseline" flexDirection="column">
      <Heading as="h2" fontSize="2em" color="blue_cumulus_main" my={0} mb={5}>
        Paramétrage de votre ERP
      </Heading>
      <Text>
        Au 15 juin 2023, les données récoltées sur le parcours de l’apprenant ont évolué afin de <br />
        mieux restituer une photographie en temps réel de l’apprentissage en France. <br />
        {!verified && (
          <>
            Ainsi, la clé d’échange (API key) actuellement installée sur votre ERP doit être changée. <br />
            <strong>
              L’opération prend quelques minutes (un tutoriel est disponible ci-dessous) si vous êtes
              <br /> habilité à modifier les paramètres de votre ERP.
            </strong>
          </>
        )}
      </Text>
      {!verified && (
        <Box mt={5}>
          <Ribbons variant="alert" px={6}>
            <Heading as="h1" fontSize="gamma">
              Comment mettre à jour votre clé d’échange
            </Heading>
            <DynamicList apiKey={organisme.api_key} copied={copied} verified={verified} />
          </Ribbons>

          <VStack gap={2} alignItems="baseline" mt={5}>
            {organisme.api_key ? (
              <>
                <Input type="text" name="apiKey" value={organisme.api_key} required readOnly />
                <CopyToClipboard
                  text={organisme.api_key}
                  onCopy={() => {
                    setCopied(true);
                    toastSuccess("Copié!");
                  }}
                >
                  <Button variant="primary">Copier la clé</Button>
                </CopyToClipboard>
              </>
            ) : (
              <>
                <Text>Cliquez sur le bouton ci-dessous pour générer votre nouvelle clé d’échange.</Text>
                <Button
                  variant="primary"
                  isLoading={isGenerating}
                  onClick={() =>
                    onGenerate()
                      .then(() => toastSuccess("Votre clé d'échange a été correctement générée."))
                      .catch((err) => {
                        console.error(err);
                        toastError("Une erreur est survenue. Merci de réessayer plus tard.");
                      })
                  }
                >
                  Générer la clé d’échange
                </Button>
              </>
            )}
          </VStack>
          {erp && <ErpTutorial erp={erp} mt={8} />}
        </Box>
      )}
      {verified && (
        <Box mt={5}>
          <HStack color="success">
            <Checkbox />
            <Text marginLeft="1w" as="span">
              Vous avez correctement installé la nouvelle clé d’échange sur votre ERP
            </Text>
          </HStack>
          <Box mt={5}>
            <Text marginLeft="1w" as="span">
              Information récues depuis votre ERP :
            </Text>
            <Table
              mt={4}
              data={[
                {
                  api_uai: organisme.api_uai,
                  api_siret: organisme.api_siret,
                  api_configuration_date: organisme.api_configuration_date,
                },
              ]}
              columns={{
                api_siret: {
                  size: 200,
                  header: () => "Siret",
                },
                api_uai: {
                  size: 200,
                  header: () => "UAI",
                },
                api_configuration_date: {
                  size: 200,
                  header: () => "Date d'interfaçage",
                  cell: ({ getValue }) => <Text fontSize="0.9rem">{formatDateDayMonthYear(getValue())}</Text>,
                },
              }}
            />
          </Box>
          <Ribbons variant="success" px={6} mt={5}>
            <Heading as="h1" fontSize="gamma">
              Félicitations ! L’opération est terminée.
            </Heading>
            <Text color="#3A3A3A" my={3}>
              Votre établissement <strong>{organisme.enseigne ?? organisme.raison_sociale}</strong> transmet bien les
              données au
              <br />
              tableau de bord via la nouvelle API installée sur votre ERP.
              <br />
              Vous n’avez plus rien à faire.
            </Text>
          </Ribbons>
        </Box>
      )}
    </Flex>
  );
};

export default ConfigurationERP;

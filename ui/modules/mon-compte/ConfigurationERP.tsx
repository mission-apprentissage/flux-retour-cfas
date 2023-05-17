import { Heading, Button, Text, OrderedList, ListItem, VStack, Input } from "@chakra-ui/react";
import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { _put } from "@/common/httpClient";
import Ribbons from "@/components/Ribbons/Ribbons";
import useToaster from "@/hooks/useToaster";

type ConfigurationERPProps = {
  apiKey: string | undefined | null;
};

const ConfigurationERP = ({ apiKey, onGenerate }: ConfigurationERPProps) => {
  const { toastSuccess, toastError } = useToaster();

  return (
    <VStack w="100%" color="#1E1E1E" gap={10} alignItems="baseline">
      <Ribbons variant="warning" px={6}>
        <Heading as="h1" fontSize="gamma">
          Paramétrez votre clé d’échange dans votre ERP
        </Heading>
        <Text>L’opération prend quelques minutes.</Text>
        <OrderedList>
          <ListItem>Veuillez générer la clé ci-dessous</ListItem>
          <ListItem>Copier la clé</ListItem>
          <ListItem>Retournez dans votre compte ERP pour la coller</ListItem>
        </OrderedList>
      </Ribbons>
      <VStack gap={2} alignItems="baseline">
        <Heading as="h1" fontSize="32px">
          Votre clé d’échange
        </Heading>
        <Text>Au 15 juin 2023, notre API pour récolter les effectifs a évolué.</Text>
        {apiKey ? (
          <>
            <Input type="text" name="apiKey" value={apiKey} required readOnly />
            <CopyToClipboard text={apiKey} onCopy={() => toastSuccess("Copié!")}>
              <Button variant="primary">Copier la clé</Button>
            </CopyToClipboard>
          </>
        ) : (
          <>
            <Text>Cliquez sur le bouton ci-dessous pour générer votre nouvelle clé d’échange (API key).</Text>
            <Button
              variant="primary"
              onClick={() =>
                onGenerate()
                  .then(() => toastSuccess(""))
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
    </VStack>
  );
};

export default ConfigurationERP;

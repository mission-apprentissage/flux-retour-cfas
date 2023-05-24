import {
  Heading,
  Button,
  Text,
  OrderedList,
  ListItem,
  VStack,
  Input,
  FormControl,
  FormLabel,
  Select,
} from "@chakra-ui/react";
import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { ERPS_FORM_CASES } from "@/common/constants/erps";
import { _put } from "@/common/httpClient";
import Ribbons from "@/components/Ribbons/Ribbons";
import useToaster from "@/hooks/useToaster";

type ConfigurationERPProps = {
  apiKey: string | undefined | null;
  erp: string | undefined | null;
  isGenerating: boolean;
  onGenerate: () => Promise<string>;
  onSave: (value: string) => Promise<void>;
};

const ErpSelectionList = [{ id: "", name: "Sélectionnez une option", state: null }].concat(ERPS_FORM_CASES as any);

const ConfigurationERP = ({ erp, apiKey, onGenerate, onSave, isGenerating }: ConfigurationERPProps) => {
  const { toastSuccess, toastError } = useToaster();

  return (
    <VStack w="100%" color="#1E1E1E" gap={10} alignItems="baseline">
      <FormControl isRequired>
        <FormLabel color="grey.800">ERP ou logiciel de gestion utilisé {erp}</FormLabel>
        <Select onChange={(event) => onSave(event.target.value)} defaultValue={erp || ""} width={"400px"}>
          {ErpSelectionList.map((erp) => (
            <option key={erp.id} value={erp.id}>
              {erp.name}
            </option>
          ))}
        </Select>
      </FormControl>

      {!apiKey && (
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
      )}
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
    </VStack>
  );
};

export default ConfigurationERP;

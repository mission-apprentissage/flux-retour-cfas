import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Button, HStack, Heading, Input, List, Text, VStack, ListIcon, ListItem, Flex } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactNode, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { ERPS_BY_ID } from "shared";

import { _delete, _post, _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import AppButton from "@/components/buttons/Button";
import Link from "@/components/Links/Link";
import AcknowledgeModal from "@/components/Modals/AcknowledgeModal";
import Ribbons from "@/components/Ribbons/Ribbons";
import useToaster from "@/hooks/useToaster";
import { FileDownloadIcon } from "@/modules/dashboard/icons";

interface StepItemProps {
  children: ReactNode;
  active?: boolean;
}

function StepItem({ children, active = false }: StepItemProps) {
  return (
    <ListItem {...(active ? { color: "bluefrance", fontWeight: "bold" } : { ml: 6 })}>
      {active && <ListIcon as={ArrowForwardIcon} color="bluefrance" />}
      {children}
    </ListItem>
  );
}

interface TransmissionsConfigurationProps {
  organisme: Organisme;
  onKeyGenerated: () => void;
}

export const TransmissionsConfiguration = ({ organisme, onKeyGenerated }: TransmissionsConfigurationProps) => {
  const router = useRouter();
  const { toastSuccess } = useToaster();
  const [copied, setCopied] = useState(false);
  const [isConfigurationModalDisplayed, setIsConfigurationModalDisplayed] = useState(false);
  const [isResetConfigurationInProgress, setIsResetConfigurationInProgress] = useState(false);

  const erpId = organisme.erps[0]; // PAS BIEN
  const erp = ERPS_BY_ID[erpId];

  const onGenerateKey = async () => {
    await _post(`/api/v1/organismes/${organisme._id}/api-key`);
    toastSuccess("Votre clé d’échange a été correctement générée.");
    await onKeyGenerated();
  };

  const ResetConfiguration = () => {
    const onConfigurationReset = async () => {
      setIsResetConfigurationInProgress(true);
      await _delete(`/api/v1/organismes/${organisme._id}/configure-erp`);
      await onKeyGenerated();
      setIsResetConfigurationInProgress(false);
      setIsConfigurationModalDisplayed(false);
    };
    return (
      <>
        <AcknowledgeModal
          title="Réinitialiser la configuration"
          acknowledgeText="Accepter"
          isOpen={isConfigurationModalDisplayed}
          onAcknowledgement={onConfigurationReset}
          onClose={() => setIsConfigurationModalDisplayed(false)}
          bgOverlay="rgba(0, 0, 0, 0.28)"
        >
          En réinitialisant la configuration, vous ne serez plus en possibilité de transmettre les données via ERP.
          Êtes-vous sûr de vouloir réinitiliaser la configuration ?
        </AcknowledgeModal>
        <Button
          variant="primary"
          px={6}
          mt={6}
          isLoading={isResetConfigurationInProgress}
          onClick={async () => setIsConfigurationModalDisplayed(true)}
        >
          Réinitialiser ma configuration
        </Button>
      </>
    );
  };

  if (organisme.mode_de_transmission !== "API") {
    return (
      <>
        <HStack justifyContent="space-between" alignItems="start" p={10} bg="#F9F8F6" maxW="894px" my={8}>
          <Box>
            <Text fontSize="gamma" fontWeight="bold">
              Votre établissement n’utilise pas d’ERP.
            </Text>
            {organisme.mode_de_transmission_configuration_date && (
              <Text>
                (configuré le {formatDateNumericDayMonthYear(organisme.mode_de_transmission_configuration_date)} par{" "}
                {organisme.mode_de_transmission_configuration_author_fullname})
              </Text>
            )}
            <Text mt={4}>Cliquez ci-dessous pour transmettre manuellement vos effectifs.</Text>
            <Link
              variant="whiteBg"
              href={`${router.asPath.substring(0, router.asPath.lastIndexOf("/"))}/effectifs/televersement`}
              mt={6}
            >
              Téléverser les effectifs
            </Link>
          </Box>
        </HStack>
        <ResetConfiguration></ResetConfiguration>
      </>
    );
  }

  return (
    <>
      <VStack alignItems="start" gap={8} w="fit-content">
        <Ribbons variant="success" fontSize="gamma" fontWeight="bold">
          <Box color="grey.800">Votre établissement utilise {erp.name}.</Box>
        </Ribbons>
        (
        <>
          {organisme.last_transmission_date_as_transmitter ? (
            <Flex justifyContent="center" alignItems="center">
              <Ribbons variant="success" fontSize="gamma" fontWeight="bold" display="inline">
                <Box color="grey.800">Votre établissement transmet.</Box>
                <Link fontSize="lg" href="/transmissions" color="bluefrance">
                  Voir les transmission
                </Link>
              </Ribbons>
            </Flex>
          ) : (
            <>
              <Heading as="h2" fontWeight="700" fontSize="24px">
                Démarrer l’interfaçage avec {erp.name}.
              </Heading>
              <Ribbons variant="alert" px={6}>
                <Heading as="h1" fontSize="gamma">
                  Comment générer votre clé d’échange
                </Heading>
                <List color="#3A3A3A" my={3}>
                  <StepItem active={!organisme.api_key}>
                    1. Générer la clé en cliquant sur le bouton ci-dessous
                  </StepItem>
                  <StepItem active={!!organisme.api_key && !copied}>2. Copier la clé</StepItem>
                  <StepItem active={!!organisme.api_key && copied}>
                    3. Retourner dans votre compte ERP pour la coller
                  </StepItem>
                </List>
              </Ribbons>
            </>
          )}

          {organisme.api_key ? (
            <>
              <Input type="text" name="apiKey" value={organisme.api_key} required readOnly w="380px" />

              <HStack gap={3}>
                <CopyToClipboard
                  text={organisme.api_key}
                  onCopy={() => {
                    setCopied(true);
                    toastSuccess("Copié !");
                  }}
                >
                  <Button variant="primary">Copier la clé</Button>
                </CopyToClipboard>
              </HStack>
            </>
          ) : (
            <HStack gap={3}>
              <AppButton variant="primary" action={onGenerateKey}>
                Générer la clé d’échange
              </AppButton>
            </HStack>
          )}
        </>
        )
        {erp.helpFilePath ? (
          <VStack
            p={6}
            borderWidth="1px"
            borderColor="dgalt"
            borderBottomWidth="4px"
            borderBottomColor="bluefrance"
            alignItems="start"
            maxWidth={"360px"}
          >
            <Heading as="h4" fontSize="gamma">
              Tutoriel pour {erp.name}
            </Heading>
            <Text pb={6}>
              Une fois votre clé générée et copiée, veuillez la coller dans votre compte ERP. Ci-dessous, voyez comment
              procéder.
            </Text>
            <Button
              as="a"
              variant={"link"}
              target="_blank"
              fontSize="md"
              mt="2"
              borderBottom="1px"
              borderRadius="0"
              mb="8"
              ml="8"
              lineHeight="6"
              p="0"
              _active={{
                color: "bluefrance",
              }}
              href={erp.helpFilePath}
            >
              <FileDownloadIcon mr="2" />
              Lire le tutoriel
            </Button>
          </VStack>
        ) : null}
        <ResetConfiguration></ResetConfiguration>
      </VStack>
    </>
  );
};

export default TransmissionsConfiguration;

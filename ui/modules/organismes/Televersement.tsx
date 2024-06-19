import {
  Box,
  Button,
  Container,
  Text,
  Flex,
  Heading,
  UnorderedList,
  ListItem,
  HStack,
  Image,
  Switch,
  FormLabel,
  Link,
  Grid,
  Badge,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { TD_MANUEL_ELEMENT_LINK } from "shared";

import { _post } from "@/common/httpClient";
import SupportLink from "@/components/Links/SupportLink";
import { BasicModal } from "@/components/Modals/BasicModal";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import DocumentsActionButtons from "@/components/Televersement/DocumentsActionButtons";
import FileUploadComponent from "@/components/Televersement/FileUploadComponent";
import InfoBetaPanel from "@/components/Televersement/InfoBetaPanel";
import useExcelFileProcessor from "@/hooks/useExcelFileProcessor";
import useToaster from "@/hooks/useToaster";
import { UploadLine } from "@/theme/components/icons";

import TeleversementTable from "./TeleversementTable";
import TeleversementValide from "./TeleversementValide";

export default function Televersement({ organismeId, isMine }: { organismeId: string; isMine: boolean }) {
  const { toastError } = useToaster();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    processedData,
    headers,
    error,
    errorsCount,
    warnings,
    missingHeaders,
    columnsWithErrors,
    showOnlyColumnsAndLinesWithErrors,
    setShowOnlyColumnsAndLinesWithErrors,
    status,
    setStatus,
  } = useExcelFileProcessor(organismeId);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setStatus("processing");
    const res = await _post(`/api/v1/organismes/${organismeId}/upload/import/v3`, processedData);
    setStatus(res.error ? "import_failure" : "import_success");
    setIsSubmitting(false);
  };

  if (error) {
    toastError(error);
  }

  if (status === "import_success") return <TeleversementValide isMine={isMine} organismeId={organismeId} />;

  const filteredHeaders =
    showOnlyColumnsAndLinesWithErrors && columnsWithErrors.length
      ? headers?.filter((header) => columnsWithErrors.includes(header))
      : headers;

  return (
    <SimplePage title="Import des effectifs">
      <Container maxW="xl" p="8">
        <Flex as="nav" align="center" justify="space-between" wrap="wrap" w="100%" alignItems="flex-start">
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            Import des effectifs{" "}
            <Badge
              backgroundColor="#FEE7FC"
              color="#6E445A"
              padding="0px 8px 0px 4px"
              borderRadius="4px"
              fontSize={14}
              p={1}
            >
              <Flex alignItems="center">
                <Image alt="eclair" src="/images/eclair.svg" mr={1} />
                version beta
              </Flex>
            </Badge>
          </Heading>

          <HStack gap={4}>
            <SupportLink href={TD_MANUEL_ELEMENT_LINK}></SupportLink>
          </HStack>
        </Flex>

        {status === "idle" && (
          <Box mt={10} px={14} py={10} bg="galt">
            <Grid templateColumns="1fr" gap={6}>
              <Box>
                <UnorderedList styleType="disc" spacing={3} pl={5}>
                  <ListItem>
                    <Text>
                      Déclarez tous vos apprenants <strong>en apprentissage</strong>, y compris les apprentis en
                      contrat, ceux dont le contrat a été rompu, les jeunes sans contrat et les cas d&apos;abandon
                      éventuels.
                    </Text>
                  </ListItem>
                  <ListItem>
                    <Text>
                      Afin de garantir la fraîcheur des données et de permettre un soutien constant de vos apprenants,
                      nous vous recommandons de nous transmettre les effectifs <strong>une fois par mois</strong>, de
                      préférence entre le 1er et le 5 de chaque mois.
                    </Text>
                  </ListItem>
                </UnorderedList>
                <DocumentsActionButtons />
                <InfoBetaPanel />
              </Box>
            </Grid>
          </Box>
        )}

        {status === "validation_success" && (
          <Ribbons variant="success" my={8}>
            <Box mb="8">
              <Text fontSize="md" fontWeight="bold" mb="2" color="grey.800">
                Le format de votre fichier a été correctement rempli.
              </Text>
              <Text fontSize="sm" color="grey.800">
                Vous pouvez relire le détail ligne à ligne ci-dessous (et défiler sur la droite). Si vous êtes
                satisfait, vous pouvez valider l’import en cliquant sur le bouton dédié en bas de cette page.{" "}
                <b>Votre fichier n’a pas encore été importé.</b>
              </Text>
            </Box>
          </Ribbons>
        )}
        {status === "validation_failure" && (
          <>
            <Ribbons variant="error" my={8}>
              <Box mb="8">
                <Text fontSize="md" fontWeight="bold" mb="2" color="grey.800">
                  {errorsCount === 1
                    ? "Une erreur a été détectée dans votre fichier"
                    : `${errorsCount} erreurs ont été détectées dans votre fichier.`}
                </Text>
                <Text fontSize="sm" color="grey.800">
                  Vous pouvez voir le détail ligne à ligne ci-dessous. Vous devez modifier votre fichier et
                  l&apos;importer à nouveau.
                </Text>
                {missingHeaders.length > 0 && (
                  <Text fontSize="sm" color="grey.800">
                    Les colonnes suivantes sont obligatoires et n’ont pas été trouvées, veuillez vérifier leur présence
                    dans le fichier&nbsp;:{" "}
                    <UnorderedList mt="4">
                      {missingHeaders.map((header) => (
                        <ListItem key={header} color="red.500">
                          {header}
                        </ListItem>
                      ))}
                    </UnorderedList>
                  </Text>
                )}
              </Box>
            </Ribbons>
          </>
        )}
        {!!warnings.contratCount && (
          <Ribbons variant="warning" mb={8}>
            <Box mb="8">
              <Text fontSize="md" fontWeight="bold" mb="2" color="grey.800">
                {warnings.contratCount}
                {warnings.contratCount === 1
                  ? " apprenant n'a aucune date de début et de fin de contrat renseignée."
                  : " apprenants n'ont aucune date de début et de fin de contrat renseignée."}
              </Text>
              <Text fontSize="sm" color="grey.800">
                Nous nous basons sur les dates de contrat, de rupture, de formation et d&apos;exclusion pour déterminer
                le statut d&apos;un effectif. N&apos;oubliez pas de remplir les dates de contrat quand il y en a un,
                sans quoi les apprentis passent automatiquement en statut &quot;abandon&quot; 3 mois après leur date
                d&apos;inscription ou 6 mois après leur date de rupture.
              </Text>
            </Box>
          </Ribbons>
        )}
        {status === "validation_failure" && (
          <HStack
            padding={6}
            border="1px solid"
            borderColor="gray.300"
            width="100%"
            justifyContent="space-between"
            alignItems="center"
          >
            <Flex gap={2}>
              <Switch
                id="show-only-errors"
                variant="icon"
                onChange={(e) => {
                  setShowOnlyColumnsAndLinesWithErrors(e.target.checked);
                }}
              />
              <FormLabel htmlFor="show-only-errors">
                Afficher uniquement les lignes et colonnes avec données en erreur
              </FormLabel>
            </Flex>
            <BasicModal
              title="Téléverser un nouveau fichier"
              size="6xl"
              renderTrigger={(onOpen) => (
                <Button
                  isLoading={isSubmitting}
                  loadingText="Import en cours"
                  onClick={() => {
                    onOpen();
                  }}
                  size="md"
                  variant="primary"
                >
                  <Flex gap={3} alignItems="center">
                    <UploadLine boxSize="4" />
                    Téléverser un nouveau fichier
                  </Flex>
                </Button>
              )}
            >
              <>
                <FileUploadComponent
                  isSubmitting={isSubmitting}
                  getRootProps={getRootProps}
                  getInputProps={getInputProps}
                  isDragActive={isDragActive}
                />
                <DocumentsActionButtons />
              </>
            </BasicModal>
          </HStack>
        )}

        {status === "validation_success" && (
          <Flex width="100%" justifyContent="flex-end">
            <Button
              isLoading={isSubmitting}
              loadingText="Import en cours"
              onClick={() => {
                setIsSubmitting(true);
                handleSubmit();
              }}
              size="md"
              variant="primary"
            >
              Valider l&apos;import
            </Button>
          </Flex>
        )}
        <Box mt={6}>
          {processedData && processedData.length > 0 && filteredHeaders && (
            <TeleversementTable
              data={processedData}
              headers={headers}
              columnsWithErrors={columnsWithErrors}
              showOnlyColumnsAndLinesWithErrors={showOnlyColumnsAndLinesWithErrors}
            />
          )}
        </Box>
        {status === "idle" && (
          <>
            <FileUploadComponent
              isSubmitting={isSubmitting}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
            />
            <Link
              onClick={() => {
                router.back();
              }}
              color="bluefrance"
              borderBottom="1px solid"
              _hover={{ cursor: "pointer", textDecoration: "none", borderBottom: "2px solid" }}
            >
              <Box as="i" className="ri-arrow-left-line" marginRight="1w" />
              Retour à l’étape précédente
            </Link>
          </>
        )}
      </Container>
    </SimplePage>
  );
}

import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Image,
  Input,
  List,
  ListIcon,
  ListItem,
  Select,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { ERPS, ERPS_BY_ID } from "shared";

import { CONTACT_ADDRESS } from "@/common/constants/product";
import { _delete, _post, _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { formatDateDayMonthYear, formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import AppButton from "@/components/buttons/Button";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import withAuth from "@/components/withAuth";
import { useOrganisationOrganisme } from "@/hooks/organismes";
import useToaster from "@/hooks/useToaster";
import NewTable from "@/modules/indicateurs/NewTable";
import { Check, DownloadLine, Checkbox as IconCheckbox } from "@/theme/components/icons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

/**
 * Composant à plusieurs états selon stepConfigurationERP.
 */
const ParametresPage = () => {
  const router = useRouter();
  const { toastSuccess } = useToaster();
  const [stepConfigurationERP, setStepConfigurationERP] = useState<
    "none" | "choix_erp" | "unsupported_erp" | "v2" | "v3"
  >("none");
  const [selectedERPId, setSelectedERPId] = useState("");
  const [unsupportedERPName, setUnsupportedERPName] = useState("");

  const erp = ERPS_BY_ID[selectedERPId];

  const { organisme, refetch: refetchOrganisme } = useOrganisationOrganisme();

  const erpV3 = (router.query.erpV3 as string | undefined)?.toLowerCase();

  // redirige vers la finalisation API v3 si le paramètre est présent (= on vient de connexion-api)
  useEffect(() => {
    if (!erpV3) {
      return;
    }
    setSelectedERPId(erpV3);
    setStepConfigurationERP("v3");
    router.push(router.pathname); // supprime le paramètre en query
  }, []);

  if (!organisme) {
    return <></>;
  }

  const title = "Paramétrage de votre moyen de transmission";
  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={8}>
          {title}
        </Heading>

        {stepConfigurationERP === "none" &&
          (organisme.mode_de_transmission ? (
            <>
              <HStack justifyContent="space-between" alignItems="start" p={10} bg="#F9F8F6" maxW="894px" my={8}>
                <Box>
                  {organisme.mode_de_transmission === "API" ? (
                    <>
                      <Text fontSize="gamma" fontWeight="bold">
                        Votre moyen de transmission est paramétré avec{" "}
                        {organisme.erps?.map((erpId) => ERPS_BY_ID[erpId]?.name).join(", ")}.
                      </Text>
                      {organisme.mode_de_transmission_configuration_date && (
                        <Text>
                          (configuré le{" "}
                          {formatDateNumericDayMonthYear(organisme.mode_de_transmission_configuration_date)} par{" "}
                          {organisme.mode_de_transmission_configuration_author_fullname})
                        </Text>
                      )}
                      <Link
                        variant="whiteBg"
                        href={`${router.asPath.substring(0, router.asPath.lastIndexOf("/"))}/effectifs`}
                        mt={6}
                      >
                        Mes effectifs
                      </Link>
                    </>
                  ) : organisme.erp_unsupported ? (
                    <>
                      <Text fontSize="gamma" fontWeight="bold">
                        Votre moyen de transmission est {organisme.erp_unsupported}.
                      </Text>
                      <Text mt={4}>
                        Actuellement, cet ERP n’est pas encore interfaçé avec le tableau de bord. Nous vous tiendrons
                        informé dès que ce sera le cas.
                      </Text>
                      <Text fontWeight="bold">En attendant, veuillez téléverser manuellement vos effectifs.</Text>
                      <Link
                        variant="whiteBg"
                        href={`${router.asPath.substring(0, router.asPath.lastIndexOf("/"))}/effectifs/televersement`}
                        mt={6}
                      >
                        Téléverser les effectifs
                      </Link>
                    </>
                  ) : (
                    <>
                      <Text fontSize="gamma" fontWeight="bold">
                        Votre établissement n’utilise pas d’ERP.
                      </Text>
                      <Text mt={4}>Cliquez ci-dessous pour transmettre manuellement vos effectifs.</Text>
                      <Link
                        variant="whiteBg"
                        href={`${router.asPath.substring(0, router.asPath.lastIndexOf("/"))}/effectifs/televersement`}
                        mt={6}
                      >
                        Téléverser les effectifs
                      </Link>
                    </>
                  )}
                </Box>

                <Image src="/images/parametres-choix-transmission.svg" alt="" userSelect="none" />
              </HStack>

              <Button
                variant="primary"
                px={6}
                mt={6}
                onClick={async () => {
                  await _delete(`/api/v1/organismes/${organisme._id}/configure-erp`);
                  await refetchOrganisme();
                }}
              >
                Réinitialiser ma configuration
              </Button>
            </>
          ) : (
            <>
              <HStack gap={7} mt={6}>
                <VStack
                  p={6}
                  borderWidth="1px"
                  borderColor="dgalt"
                  borderBottomWidth="4px"
                  borderBottomColor="bluefrance"
                  alignItems="start"
                >
                  <Heading as="h4" fontSize="gamma">
                    Vous avez un ERP ?
                  </Heading>
                  <Text pb={6}>Liez votre ou vos ERP au tableau de bord</Text>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStepConfigurationERP("choix_erp");
                    }}
                  >
                    Choisir cette méthode
                  </Button>
                </VStack>

                <VStack
                  p={6}
                  borderWidth="1px"
                  borderColor="dgalt"
                  borderBottomWidth="4px"
                  borderBottomColor="bluefrance"
                  alignItems="start"
                >
                  <Heading as="h4" fontSize="gamma">
                    Vous n’avez pas d’ERP ?
                  </Heading>
                  <Text pb={6}>Importez vos effectifs avec un fichier Excel</Text>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await _put(`/api/v1/organismes/${organisme._id}/configure-erp`, {
                        mode_de_transmission: "MANUEL",
                      });
                      await refetchOrganisme();
                    }}
                  >
                    Choisir cette méthode
                  </Button>
                </VStack>
              </HStack>
            </>
          ))}

        {stepConfigurationERP === "choix_erp" && (
          <>
            <FormControl isRequired mb={4} w="fit-content" onChange={(e: any) => setSelectedERPId(e.target.value)}>
              <FormLabel>Sélectionnez votre ERP ou outil de gestion utilisé</FormLabel>
              <Select>
                {/* Déclenche un warning chakra mais obligé pour avoir un placeholder non sélectionnable */}
                <option selected hidden disabled value="">
                  ERP...
                </option>
                {ERPS.map((erp) => (
                  <option value={erp.id} key={erp.id}>
                    {erp.name}
                  </option>
                ))}

                <option value="other" key="other">
                  J’utilise un autre ERP
                </option>
              </Select>
            </FormControl>

            <Button
              variant="primary"
              px={6}
              isDisabled={!selectedERPId}
              onClick={() => {
                setStepConfigurationERP(selectedERPId === "other" ? "unsupported_erp" : erp.apiV3 ? "v3" : "v2");
              }}
            >
              Confirmer
            </Button>
          </>
        )}

        {stepConfigurationERP === "unsupported_erp" && (
          <VStack alignItems="start" gap={8}>
            <Ribbons variant="success" fontSize="gamma" fontWeight="bold">
              <Box color="grey.800">Votre établissement utilise un autre ERP.</Box>
            </Ribbons>

            <FormControl isRequired mb={4} w="fit-content" onChange={(e: any) => setUnsupportedERPName(e.target.value)}>
              <FormLabel>Veuillez indiquer le nom de votre ERP&nbsp;:</FormLabel>
              <Input name="erp_name" placeholder="Nom de l’ERP..." />
            </FormControl>

            <AppButton
              variant="primary"
              px={6}
              isDisabled={unsupportedERPName.length === 0}
              action={async () => {
                await _put(`/api/v1/organismes/${organisme._id}/configure-erp`, {
                  mode_de_transmission: "MANUEL",
                  erp_unsupported: unsupportedERPName,
                });
                await refetchOrganisme();
                setStepConfigurationERP("none");
                setSelectedERPId("");
                setUnsupportedERPName("");
              }}
            >
              Valider
            </AppButton>
          </VStack>
        )}
        {stepConfigurationERP === "v2" && (
          <ConfigurationERPV2
            erpId={selectedERPId}
            onSubmit={async () => {
              await _put(`/api/v1/organismes/${organisme._id}/configure-erp`, {
                mode_de_transmission: "API",
                erps: [selectedERPId],
              });
              await refetchOrganisme();
              setStepConfigurationERP("none");
              setSelectedERPId("");
            }}
          />
        )}

        {stepConfigurationERP === "v3" && (
          <ConfigurationERPV3
            organisme={organisme}
            erpId={selectedERPId}
            onGenerateKey={async () => {
              await _post(`/api/v1/organismes/${organisme._id}/api-key`);
              toastSuccess("Votre clé d’échange a été correctement générée.");
              await refetchOrganisme();
            }}
            onConfigurationMismatch={async () => {
              setStepConfigurationERP("none");
              setSelectedERPId("");
            }}
            onSubmit={async () => {
              await _put(`/api/v1/organismes/${organisme._id}/configure-erp`, {
                mode_de_transmission: "API",
                erps: [selectedERPId],
              });
              await refetchOrganisme();
              setStepConfigurationERP("none");
              setSelectedERPId("");
            }}
          />
        )}
      </Container>
    </SimplePage>
  );
};

export default withAuth(ParametresPage);

interface ConfigurationERPV2Props {
  erpId: string;
  onSubmit: () => any;
}
function ConfigurationERPV2(props: ConfigurationERPV2Props) {
  const [configurationFinished, setConfigurationFinished] = useState(false);
  const erp = ERPS_BY_ID[props.erpId];

  return (
    <VStack alignItems="start" gap={8}>
      <Ribbons variant="success" fontSize="gamma" fontWeight="bold">
        <Box color="grey.800">Votre établissement utilise {erp.name}.</Box>
      </Ribbons>

      <Heading as="h2" fontWeight="700" fontSize="24px">
        Démarrer l’interfaçage avec {erp.name}.
      </Heading>

      {erp?.helpFilePath && (
        <Stack>
          <Link variant="link" href={erp.helpFilePath} isExternal>
            Télécharger le pas-à-pas {erp.name}
            <DownloadLine color="bluefrance" mb={1} ml={2} fontSize="xs" />
          </Link>
          {erp.helpFileSize && (
            <Text color="grey.600" fontSize={"xs"}>
              PDF – {erp.helpFileSize}
            </Text>
          )}
        </Stack>
      )}

      <Text color="labelgrey">
        <b>Temps estimé :</b> 5 minutes
      </Text>
      <Box color="labelgrey">
        <b>Pré-requis :</b>
        <p>La configuration doit être effectuée par un administrateur sur {erp.name}.</p>
        <p>Votre logiciel doit être à jour.</p>
        <p>Vous devez avoir renseigné votre UAI et votre SIRET dans {erp.name}.</p>
      </Box>

      <Checkbox
        icon={<Check />}
        onChange={(e) => {
          setConfigurationFinished(e.target.checked);
        }}
      >
        J’ai bien paramétré mon ERP avec le tableau de bord.
      </Checkbox>

      <Button variant="primary" px={6} isDisabled={!configurationFinished} onClick={props.onSubmit}>
        Finaliser la configuration
      </Button>
    </VStack>
  );
}

interface ConfigurationERPV3Props {
  erpId: string;
  organisme: Organisme;
  onGenerateKey: () => any;
  onConfigurationMismatch: () => any;
  onSubmit: () => any;
}
function ConfigurationERPV3(props: ConfigurationERPV3Props) {
  const { toastSuccess } = useToaster();
  const [copied, setCopied] = useState(false);

  const erp = ERPS_BY_ID[props.erpId];
  const verified = !!props.organisme.api_siret && !!props.organisme.api_uai;

  return (
    <VStack alignItems="start" gap={8} w="fit-content">
      <Ribbons variant="success" fontSize="gamma" fontWeight="bold">
        <Box color="grey.800">Votre établissement utilise {erp.name}.</Box>
      </Ribbons>

      {verified ? (
        <>
          <Heading as="h2" fontWeight="700" fontSize="24px">
            Finalisez l’opération de paramétrage pour transmettre vos effectifs.
          </Heading>
          <HStack color="success">
            <IconCheckbox />
            <Text marginLeft="1w" as="span">
              Vous avez correctement installé la nouvelle clé d’échange sur votre ERP
            </Text>
          </HStack>
          <Box mt={5}>
            <Text mb={4}>
              Confirmez que l’UAI et le SIRET indiqués ci-dessous correspondent à votre établissement&nbsp;:
            </Text>
            <NewTable
              data={[
                {
                  api_uai: props.organisme.api_uai,
                  api_siret: props.organisme.api_siret,
                  api_configuration_date: props.organisme.api_configuration_date,
                },
              ]}
              showPagination={false}
              columns={[
                {
                  header: () => "Organisme de formation",
                  accessorKey: "_id",
                  enableSorting: false,
                  size: 450,
                  cell: () => props.organisme.enseigne ?? props.organisme.raison_sociale ?? "Organisme inconnu",
                },
                {
                  header: () => "SIRET",
                  accessorKey: "api_siret",
                  size: 150,
                  enableSorting: false,
                },
                {
                  header: () => "UAI",
                  accessorKey: "api_uai",
                  size: 100,
                  enableSorting: false,
                },
                {
                  header: () => "Interfaçage",
                  accessorKey: "api_configuration_date",
                  size: 150,
                  enableSorting: false,
                  cell: ({ getValue }) => formatDateDayMonthYear(getValue()),
                },
              ]}
            />
          </Box>
          <HStack alignSelf="end" gap={6}>
            <Link
              variant="whiteBg"
              px={6}
              href={`mailto:${CONTACT_ADDRESS}?subject=Mauvais configuration paramétrage ERP - API`}
              onClick={props.onConfigurationMismatch}
            >
              Je ne confirme pas
            </Link>
            <AppButton variant="primary" px={6} action={props.onSubmit}>
              Je confirme
            </AppButton>
          </HStack>
        </>
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
              <StepItem active={!props.organisme.api_key}>
                1. Générer la clé en cliquant sur le bouton ci-dessous
              </StepItem>
              <StepItem active={!!props.organisme.api_key && !copied && !verified}>2. Copier la clé</StepItem>
              <StepItem active={!!props.organisme.api_key && copied && !verified}>
                3. Retourner dans votre compte ERP pour la coller
              </StepItem>
              <StepItem active={!!props.organisme.api_key && copied && !verified}>
                4. Finaliser en confirmant l’UAI et SIRET de votre établissement
              </StepItem>
            </List>
          </Ribbons>

          {props.organisme.api_key ? (
            <>
              <Input type="text" name="apiKey" value={props.organisme.api_key} required readOnly w="380px" />
              <CopyToClipboard
                text={props.organisme.api_key}
                onCopy={() => {
                  setCopied(true);
                  toastSuccess("Copié !");
                }}
              >
                <Button variant="primary">Copier la clé</Button>
              </CopyToClipboard>
            </>
          ) : (
            <AppButton variant="primary" action={props.onGenerateKey}>
              Générer la clé d’échange
            </AppButton>
          )}
        </>
      )}
    </VStack>
  );
}

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

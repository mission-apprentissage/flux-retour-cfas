import { ArrowForwardIcon, InfoIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
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
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { IErp } from "shared";

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
import { useErp } from "@/hooks/useErp";
import useToaster from "@/hooks/useToaster";
import { FileDownloadIcon } from "@/modules/dashboard/icons";
import NewTable from "@/modules/indicateurs/NewTable";
import { Checkbox as IconCheckbox } from "@/theme/components/icons";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const desiredOrder = [
  "ymag",
  "gesti",
  "scform",
  "fcamanager",
  "aimaira",
  "ammon",
  "cactus",
  "myclic",
  "gescicca",
  "formasup",
  "formasup-hdf",
  "charlemagne",
  "ammon",
  "ofa-link",
  "filiz",
  "hyperplanning",
];

/**
 * Composant à plusieurs états selon stepConfigurationERP.
 */
const ParametresPage = () => {
  const router = useRouter();
  const { toastSuccess } = useToaster();
  const [stepConfigurationERP, setStepConfigurationERP] = useState<"none" | "choix_erp" | "unsupported_erp" | "v3">(
    "none"
  );
  const [selectedERPId, setSelectedERPId] = useState("");
  const [selectedERP, setSelectedERP] = useState({} as IErp);
  const [unsupportedERPName, setUnsupportedERPName] = useState("");

  const { erps, erpsById } = useErp();

  const { organisme, refetch: refetchOrganisme } = useOrganisationOrganisme();

  const erpV3 = (router.query.erpV3 as string | undefined)?.toLowerCase();

  useEffect(() => {
    setSelectedERP(erpsById[selectedERPId]);
  }, [selectedERPId]);
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
    window.location.href = "/";
    return null;
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
                        {organisme.erps?.map((erpId) => erpsById[erpId]?.name).join(", ")}.
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
                      {organisme.mode_de_transmission_configuration_date && (
                        <Text>
                          (configuré le{" "}
                          {formatDateNumericDayMonthYear(organisme.mode_de_transmission_configuration_date)} par{" "}
                          {organisme.mode_de_transmission_configuration_author_fullname})
                        </Text>
                      )}
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
                      {organisme.mode_de_transmission_configuration_date && (
                        <Text>
                          (configuré le{" "}
                          {formatDateNumericDayMonthYear(organisme.mode_de_transmission_configuration_date)} par{" "}
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
              <HStack alignItems="start" color="mgalt" mt={8}>
                <InfoIcon />
                <Text>
                  Un outil de gestion / ERP (Enterprise Ressource Planning ou PGI pour Progiciel de Gestion Intégré) est
                  une solution logicielle permettant d’unifier le système d’information d’une entreprise autour d’une
                  base de données unique.
                </Text>
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
                {erps
                  .filter(({ disabled }) => !disabled)
                  .sort((a, b) => {
                    const indexA = desiredOrder.indexOf(a.unique_id);
                    const indexB = desiredOrder.indexOf(b.unique_id);
                    return indexA - indexB;
                  })
                  .map((erp) => (
                    <option value={erp.unique_id} key={erp.unique_id}>
                      {erp.name}
                    </option>
                  ))}

                <option value="other" key="other">
                  J’utilise un autre ERP
                </option>
              </Select>
            </FormControl>

            <HStack gap={3}>
              <Button
                variant="secondary"
                px={6}
                onClick={() => {
                  setStepConfigurationERP("none");
                  setSelectedERPId("");
                }}
              >
                Revenir en arrière
              </Button>

              <Button
                variant="primary"
                px={6}
                isDisabled={!selectedERPId}
                onClick={() => {
                  setStepConfigurationERP(selectedERP.apiV3 ? "v3" : "unsupported_erp");
                }}
              >
                Confirmer
              </Button>
            </HStack>
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

            <HStack gap={3}>
              <Button
                variant="secondary"
                px={6}
                onClick={() => {
                  setStepConfigurationERP("choix_erp");
                  setSelectedERPId("");
                }}
              >
                Revenir en arrière
              </Button>

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
            </HStack>
          </VStack>
        )}

        {stepConfigurationERP === "v3" && (
          <ConfigurationERPV3
            erpsById={erpsById}
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
            onBack={() => {
              setStepConfigurationERP("choix_erp");
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

interface ConfigurationERPV3Props {
  erpId: string;
  organisme: Organisme;
  onGenerateKey: () => any;
  onConfigurationMismatch: () => any;
  onBack: () => any;
  onSubmit: () => any;
  erpsById: Array<IErp>;
}
function ConfigurationERPV3(props: ConfigurationERPV3Props) {
  const { toastSuccess } = useToaster();
  const [copied, setCopied] = useState(false);

  const erp = props.erpsById[props.erpId];
  const verified = !!props.organisme.api_siret && !!props.organisme.api_uai;

  if (!erp) {
    return (
      <>
        <Ribbons variant="alert" fontSize="gamma" fontWeight="bold">
          <Box color="grey.800">
            L’ERP {props.erpId} n’est pas pris en charge. Veuillez{" "}
            <Link
              variant="link"
              color="inherit"
              href={`mailto:${CONTACT_ADDRESS}?subject=ERP non pris en charge "${props.erpId}" détecté lors du paramétrage`}
              isExternal
            >
              contacter le support
            </Link>
            .
          </Box>
        </Ribbons>
      </>
    );
  }

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
              href={`mailto:${CONTACT_ADDRESS}?subject=Mauvaise configuration paramétrage ERP - API`}
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

              <HStack gap={3}>
                <Button variant="secondary" px={6} onClick={props.onBack}>
                  Revenir en arrière
                </Button>

                <CopyToClipboard
                  text={props.organisme.api_key}
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
              <Button variant="secondary" px={6} onClick={props.onBack}>
                Revenir en arrière
              </Button>

              <AppButton variant="primary" action={props.onGenerateKey}>
                Générer la clé d’échange
              </AppButton>
            </HStack>
          )}
        </>
      )}
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

import { CheckIcon, ChevronDownIcon, ChevronUpIcon, WarningTwoIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Container,
  Input,
  Spinner,
  Table,
  Text,
  Thead,
  Tr,
  Td,
  Th,
  Tbody,
  Flex,
  Heading,
  UnorderedList,
  ListItem,
  HStack,
  Switch,
  FormLabel,
  Image,
  Link,
  VStack,
  Grid,
  Badge,
  Collapse,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cyrb53Hash, normalize, TD_MANUEL_ELEMENT_LINK } from "shared";
import XLSX from "xlsx";

import { _post } from "@/common/httpClient";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import parseExcelBoolean from "@/common/utils/parseExcelBoolean";
import parseExcelDate from "@/common/utils/parseExcelDate";
import ButtonTeleversement from "@/components/buttons/ButtonTeleversement";
import SupportLink from "@/components/Links/SupportLink";
import { BasicModal } from "@/components/Modals/BasicModal";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import useToaster from "@/hooks/useToaster";
import { Book, DownloadLine, ValidateIcon, Warning } from "@/theme/components/icons";
import DownloadSimple from "@/theme/components/icons/DownloadSimple";
import Eye from "@/theme/components/icons/Eye";
import Video from "@/theme/components/icons/Video";

import headerTooltips from "./headerTooltips";
import InfoTeleversement from "./InfoTeleversement";

const POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH = 2000;

const dateFields = [
  "date_de_naissance_apprenant",
  "date_metier_mise_a_jour_statut",
  "contrat_date_debut",
  "contrat_date_fin",
  "contrat_date_rupture",
  "date_obtention_diplome_formation",
  "date_exclusion_formation",
  "date_rqth_apprenant",
  "date_inscription_formation",
  "date_entree_formation",
  "date_fin_formation",
  "contrat_date_debut_2",
  "contrat_date_fin_2",
  "contrat_date_rupture_2",
  "contrat_date_debut_3",
  "contrat_date_fin_3",
  "contrat_date_rupture_3",
  "contrat_date_debut_4",
  "contrat_date_fin_4",
  "contrat_date_rupture_4",
];

const booleanFields = ["rqth_apprenant", "obtention_diplome_formation", "formation_presentielle"];

const mandatoryFields = [
  "nom_apprenant",
  "prenom_apprenant",
  "date_de_naissance_apprenant",
  "annee_scolaire",
  "date_inscription_formation",
  "date_entree_formation",
  "date_fin_formation",
  "etablissement_responsable_uai",
  "etablissement_responsable_siret",
  "etablissement_formateur_uai",
  "etablissement_formateur_siret",
  "etablissement_lieu_de_formation_uai",
  "etablissement_lieu_de_formation_siret",
  "email_contact",
  "adresse_apprenant",
  "code_postal_apprenant",
  "sexe_apprenant",
  "annee_formation",
];

type Status = "validation_success" | "validation_failure" | "import_success" | "import_failure";

// Enrich data with source and id_erp_apprenant
function toEffectifsQueue(data: any[]) {
  return data.map((e) => ({
    ...e,
    // Generate a unique id for each row, based on the apprenant's name and birthdate.
    // Source: https://mission-apprentissage.slack.com/archives/C02FR2L1VB8/p1693294663898159?thread_ts=1693292246.217809&cid=C02FR2L1VB8
    id_erp_apprenant: cyrb53Hash(
      normalize(e.prenom_apprenant || "").trim() +
        normalize(e.nom_apprenant || "").trim() +
        (e.date_de_naissance_apprenant || "").trim()
    ),
  }));
}

function fromIsoLikeDateStringToFrenchDate(date: string) {
  if (!date || String(date) !== date) return date;
  if (date.match(/^(\d{4})-(\d{2})-(\d{2})$/)) {
    return formatDateNumericDayMonthYear(date);
  }
}

export default function Televersement({ organismeId, isMine }: { organismeId: string; isMine: boolean }) {
  const { toastError } = useToaster();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [data, setData] = useState<any[] | null>(null);
  const [errorsCount, setErrorsCount] = useState(0);
  const [warnings, setWarnings] = useState<{ contratCount?: number }>({});
  const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
  const [columsWithErrors, setColumsWithErrors] = useState<string[]>([]);
  const [showOnlyColumnsAndLinesWithErrors, setShowOnlyColumnsAndLinesWithErrors] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const router = useRouter();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    // On drop, read the file and parse it, then return data with validation errors.
    onDrop: (acceptedFiles: File[]) => {
      setShowOnlyColumnsAndLinesWithErrors(false);
      setIsSubmitting(true);
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const bstr = e.target?.result;
        if (!bstr) {
          toastError("Erreur lors de la lecture du fichier, veuillez réessayer");
          setIsSubmitting(false);
          return;
        }

        // Get data from first sheet
        const workbook = XLSX.read(bstr, { type: "binary" });
        const worksheetName = workbook.SheetNames[0];
        if (!worksheetName) {
          toastError("Impossible de charger la première feuille du fichier Excel");
          setIsSubmitting(false);
          return;
        }
        const worksheet = workbook.Sheets[worksheetName];
        const rawJsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

        if (rawJsonData.length - 1 > POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH) {
          toastError(
            `Pour des raisons techniques et de sécurité, votre fichier ne doit pas dépasser ${POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH} lignes.
             Veuillez téléverser un premier fichier de ${POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH} lignes/effectifs et renouveler l'opération avec
             un deuxième fichier comprenant le nombre de lignes restantes.`
          );
          setIsSubmitting(false);
          return;
        }

        // Remove "*" from headers (it is used in model) and trim
        const headers: string[] = rawJsonData[0].map((e) => e.toLocaleLowerCase().replace(/\*/g, "").trim());
        setHeaders(headers);

        // Initialize data with headers as keys
        const jsonData = rawJsonData
          .slice(1)
          .filter((row) => {
            return row.some((cell) => cell !== "" && cell !== undefined);
          })
          .map((row: any[]) => {
            return headers.reduce((acc: any, header: string, index: number) => {
              if (dateFields.includes(header)) {
                acc[header] = parseExcelDate(row[index]); // Excel date can be weird, we have to accept multiple formats.
              } else if (booleanFields.includes(header)) {
                acc[header] = parseExcelBoolean(row[index]);
              } else {
                acc[header] = row[index] === "" ? null : row[index];
              }
              return acc;
            }, {});
          });

        // Send data to API for validation.
        const res = await _post(`/api/v1/organismes/${organismeId}/upload/validate`, toEffectifsQueue(jsonData));
        // The response is an array of errors (zod)
        // Iterate over the array and add the error to the corresponding row
        const errors = res.error?.issues || [];
        setErrorsCount(errors.length);
        setWarnings(res.warnings);
        const errorsByRow = errors.reduce((acc: any, error: any) => {
          const row = error.path[0];
          const message = error.message;
          if (!acc[row]) acc[row] = [];
          acc[row].push({
            message,
            key: error.path[1],
          });
          return acc;
        }, {});
        setColumsWithErrors(Array.from(new Set<string>(errors.map((e: any) => e.path[1]))));

        setMissingHeaders(mandatoryFields.filter((header) => !headers.includes(header)));

        const rows = jsonData.map((row: any, index: number) => {
          const errors = errorsByRow[index] || [];
          return { ...row, errors };
        });
        setStatus(errors.length ? "validation_failure" : "validation_success");
        setData(rows);
        setIsSubmitting(false);
      };

      reader.readAsBinaryString(file);
    },
    onDropRejected: (rejections) => {
      toastError(`Ce fichier ne peut pas être déposé : ${rejections?.[0]?.errors?.[0]?.message}`);
      setIsSubmitting(false);
    },
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
  });

  const style = useMemo(
    () => ({
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px",
      borderWidth: 2,
      borderColor: "#000091",
      borderStyle: "dashed",
      borderRadius: 6,
      color: "#9c9c9c",
      transition: "border .24s ease-in-out",
      ...(isDragActive
        ? {
            borderColor: "#3a55d1",
          }
        : {}),
    }),
    [isDragActive]
  );

  // Send data to API (via effectifQueue).
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const res = await _post(`/api/v1/organismes/${organismeId}/upload/import/v3`, toEffectifsQueue(data || []));
    setStatus(res.error ? "import_failure" : "import_success");
    setIsSubmitting(false);
  };

  if (status === "import_success") return <ImportSuccess isMine={isMine} organismeId={organismeId} />;

  const filteredHeaders =
    showOnlyColumnsAndLinesWithErrors && columsWithErrors.length
      ? headers?.filter((header) => columsWithErrors.includes(header))
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

        {status === null && (
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
                <Flex mt={4} gap="6" mb={5}>
                  <ButtonTeleversement href="/modele-import.xlsx">
                    <DownloadSimple mr="2" />
                    Télécharger le modèle Excel
                  </ButtonTeleversement>
                  <BasicModal
                    renderTrigger={(onOpen) => (
                      <ButtonTeleversement
                        onClick={(e) => {
                          e.preventDefault();
                          onOpen();
                        }}
                      >
                        <Eye mr={2} />
                        Les données obligatoires
                      </ButtonTeleversement>
                    )}
                    title="Les données obligatoires à renseigner"
                    size="4xl"
                  >
                    <InfoTeleversement />
                  </BasicModal>
                  <ButtonTeleversement href="https://mission-apprentissage.notion.site/Guide-des-donn-es-57bc2515bac34cee9359e517a504df20">
                    <Book mr={2} />
                    Guide des données
                  </ButtonTeleversement>
                  <ButtonTeleversement href="https://www.canva.com/design/DAF0aDLacTk/ZxY16rI7C_vBzEuyrEpbIA/watch">
                    <Video mr="2" />
                    Tutoriel en vidéo
                  </ButtonTeleversement>
                </Flex>
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
          <HStack my={8}>
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
          </HStack>
        )}

        <Box mt={10}>
          {data && filteredHeaders && (
            <Box overflowX="auto" mb="8">
              <Table fontSize="sm">
                <Thead>
                  <Tr>
                    <Th>
                      <Header header="Ligne" />
                    </Th>
                    <Th>Statut</Th>
                    {filteredHeaders.map((key) => (
                      <Th key={key}>
                        <Header header={key} />
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {data.map((row: any, index: number) => {
                    if (showOnlyColumnsAndLinesWithErrors && row.errors.length === 0) return null;
                    return (
                      <Tr key={index}>
                        <Td>{index + 2}</Td>
                        <Td>
                          {row.errors.length === 0 ? (
                            <Flex color="green.500" alignItems="center">
                              <CheckIcon />
                              <Text ml="2">Valide</Text>
                            </Flex>
                          ) : (
                            <Flex color="red.500" alignItems="center">
                              <WarningTwoIcon />
                              <Text ml="2">
                                {row.errors.length}&nbsp;erreur{row.errors.length > 1 ? "s" : ""}
                              </Text>
                            </Flex>
                          )}
                        </Td>
                        {filteredHeaders.map((key) => {
                          if (row.errors.length > 0) {
                            const error = row.errors.find((e: any) => e.key === key);
                            if (error) {
                              return (
                                <Td key={key}>
                                  <Text color="grey.500">
                                    {(dateFields.includes(key)
                                      ? fromIsoLikeDateStringToFrenchDate(row[key])
                                      : row[key]) || "Donnée manquante"}
                                  </Text>
                                  <Text color="red.500">{error.message.replace("String", "Texte")}</Text>
                                </Td>
                              );
                            }
                          }
                          return (
                            <Td key={key}>
                              {dateFields.includes(key) ? fromIsoLikeDateStringToFrenchDate(row[key]) : row[key]}
                            </Td>
                          );
                        })}
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
        {status === "validation_success" && (
          <>
            <Button
              isLoading={isSubmitting}
              loadingText="Import en cours"
              onClick={() => {
                setIsSubmitting(true);
                handleSubmit();
              }}
              size="md"
              variant="primary"
              mb={8}
            >
              Valider l&apos;import
            </Button>
          </>
        )}
        {(status === "validation_failure" || status === null) && (
          <>
            <Text fontWeight="bold" fontSize={20}>
              Sélectionner un document à importer
            </Text>
            <VStack align="start" mt={3} spacing={0}>
              <Text>Sélectionner un fichier contenant vos effectifs à importer (maximum 2000).</Text>
              <Text>Si vous utilisez plusieurs fichiers, merci d’importer vos documents un par un.</Text>
            </VStack>
            <Box {...getRootProps<any>({ style })} my={8} minH="200px">
              {isSubmitting ? (
                <Box textAlign="center" flex="1" flexDirection="column">
                  <Spinner />
                  <Text mt={2}>Veuillez patienter quelques secondes</Text>
                </Box>
              ) : (
                <>
                  <Input {...(getInputProps() as any)} />
                  {isDragActive ? (
                    <Text>Glissez et déposez ici ...</Text>
                  ) : (
                    <>
                      <DownloadLine boxSize="4" color="bluefrance" mb={4} />
                      <Text color="mgalt">Glissez le fichier dans cette zone ou cliquez sur le bouton</Text>
                      <Text color="mgalt">pour ajouter un document Excel (xlsx) depuis votre disque dur</Text>
                      <Button size="md" variant="secondary" mt={4}>
                        Ajouter un document
                      </Button>
                    </>
                  )}
                </>
              )}
            </Box>
          </>
        )}
        {status === null && (
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
        )}
      </Container>
    </SimplePage>
  );
}

function ImportSuccess({ organismeId, isMine }: { organismeId: string; isMine: boolean }) {
  return (
    <SimplePage title="Import des effectifs">
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          Import des effectifs
        </Heading>
        <Box p="32px" mb="32px" border="1px solid #EEE">
          <Box></Box>
          <Box color="#18753C">
            <HStack mb="12px">
              <ValidateIcon boxSize={7} />
              <Box>
                <Text fontSize="24px" fontWeight="700">
                  Votre fichier a été accepté : consultez le rapport de transmission.
                </Text>
              </Box>
            </HStack>
            <HStack mb="12px">
              <Warning boxSize={5} color="#B34000" />
              <Box color="#B34000" fontSize="16px" fontWeight="400" lineHeight="24px">
                <Text>
                  <Text as="span" fontWeight="bold">
                    Attention :{" "}
                  </Text>
                  le contrôle a été réalisé sur le format des données de votre fichier, mais pas sur l’exactitude du
                  contenu.
                </Text>
                <Text>
                  Veuillez consulter le{" "}
                  <Link href="/transmissions" textDecoration={"underline"}>
                    rapport de transmission
                  </Link>{" "}
                  pour identifier et réparer les erreurs potentielles.
                </Text>
              </Box>
            </HStack>
          </Box>
          <Box>
            {" "}
            Vos effectifs sont en attente d&apos;affichage sur votre espace et seront disponibles dans quelques minutes,
            le temps que le traitement soit effectué.
          </Box>
          <Box>
            <Text as="span" fontWeight="bold">
              Information :{" "}
            </Text>
            Transmettez vos effectifs au tableau de bord une fois par mois, de préférence entre le 1 et le 5 du mois.
            Cela permet de garantir la fraîcheur des données. Pour chaque nouveau téléversement, vos données seront
            mises à jour ou complétées.
          </Box>
        </Box>
        <Flex justifyContent="flex-end" gap="24px">
          <Button variant="secondary" as="a" href="/transmissions">
            Voir le rapport de transmission
          </Button>
          <Button variant="primary" as="a" href={isMine ? "/effectifs" : `/organismes/${organismeId}/effectifs`}>
            Voir mes effectifs
          </Button>
        </Flex>
        <HStack justifyContent="space-between" alignItems="start" p={10} bg="#F5F5FE" my={8}>
          <Box>
            <Text color="#161616" fontSize="22px" fontWeight="700" mb="12px">
              Pourquoi consulter vos effectifs ?
            </Text>
            <Text fontSize="16px" fontWeight="400" mb="12px">
              Sur la page “Mes effectifs”, vous avez la possibilité de :{" "}
            </Text>
            <UnorderedList pl="3px">
              <ListItem>
                voir si tous vos effectifs en apprentissage ont bien été pris en compte et s’affichent
              </ListItem>
              <ListItem>comprendre d’éventuelles erreurs et de les corriger</ListItem>
              <ListItem>téléverser un nouveau fichier mis à jour</ListItem>
            </UnorderedList>
          </Box>
          <Image src="/images/televersement-manuel-success.svg" alt="" userSelect="none" />
        </HStack>
      </Container>
    </SimplePage>
  );
}

function InfoBetaPanel() {
  const [show, setShow] = useState(false);
  const handleToggle = () => setShow(!show);

  const linkStyle = {
    color: "#000091",
    textDecoration: "underline",
    textUnderlineOffset: "4px",
    cursor: "pointer",
  };

  return (
    <Ribbons variant="info" mb={6}>
      <Text color="#3A3A3A" fontSize="gamma" fontWeight="bold" mb={4}>
        Quelques conseils sur le remplissage du fichier Excel :
      </Text>
      <Text style={linkStyle} onClick={handleToggle} mb={2}>
        {" "}
        {!show ? <ChevronDownIcon /> : <ChevronUpIcon />} Voir les détails
      </Text>
      <Collapse in={show}>
        <Text color="grey.800">
          <UnorderedList spacing={2} px={6}>
            <ListItem>Vérifiez que tous vos apprentis soient bien présents dans le fichier.</ListItem>
            <ListItem>
              Pour téléverser vos effectifs, vous avez 2 options : remplir directement le modèle Excel (téléchargeable
              ci-dessus) avec vos effectifs, ou créer un fichier personnalisé, en{" "}
              <strong>conservant les mêmes en-têtes de colonne</strong> que le fichier-modèle.
            </ListItem>
            <ListItem>
              Nous nous basons sur les dates de contrat, de rupture, de formation et d’exclusion pour déterminer le
              statut d’un effectif. Veuillez <strong>remplir les colonnes associées à ces évènements</strong>.
            </ListItem>
            <ListItem>
              Actuellement, il n&apos;est pas possible de téléverser deux fichiers en même temps, mais nous y
              travaillons.
            </ListItem>
            <ListItem>
              Si votre établissement ne comptabilise <strong>aucun effectif</strong> en apprentissage à la date du jour,
              il n’est pas nécessaire d’ajouter un fichier.
            </ListItem>
            <ListItem>
              Si vous n&apos;avez pas accès à Excel ou si vous ne l&apos;utilisez pas, vous pouvez utiliser un{" "}
              <Link
                isExternal
                href="https://www.zamzar.com/fr/convert/numbers-to-xls/"
                textDecoration="underLine"
                display="inline"
              >
                convertisseur en ligne
              </Link>{" "}
              . Pour les utilisateurs de Numbers (ou autre logiciel), vous avez la possibilité d’exporter le fichier au
              format .xls (Fichier &gt; Exporter vers &gt; Excel)
            </ListItem>
            <ListItem>
              Aujourd’hui, le téléversement régulier de vos effectifs au tableau de bord ne vous dispense pas de
              répondre à l’enquête annuelle SIFA. Cependant, cela facilitera la préparation du fichier nécessaire à
              cette enquête (voir l’onglet “Mon enquête SIFA”).
            </ListItem>
          </UnorderedList>
        </Text>
      </Collapse>
    </Ribbons>
  );
}

function Header({ header }: { header: string }) {
  if (headerTooltips[header]) {
    return (
      <Flex>
        {header}
        <InfoTooltip
          contentComponent={() => <Box padding="2w">{headerTooltips[header]}</Box>}
          aria-label="État de la donnée."
        />
      </Flex>
    );
  }
  return <>{header}</>;
}

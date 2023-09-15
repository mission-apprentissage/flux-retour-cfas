import { CheckIcon, WarningTwoIcon } from "@chakra-ui/icons";
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
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import XLSX from "xlsx";

import { _post } from "@/common/httpClient";
import parseExcelBoolean from "@/common/utils/parseExcelBoolean";
import parseExcelDate from "@/common/utils/parseExcelDate";
import { cyrb53Hash, normalize } from "@/common/utils/stringUtils";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import useToaster from "@/hooks/useToaster";
import { FileDownloadIcon } from "@/modules/dashboard/icons";
import { DownloadLine } from "@/theme/components/icons";

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
];

const booleanFields = ["rqth_apprenant", "obtention_diplome_formation", "formation_presentielle"];

type Status = "validation_success" | "validation_failure" | "import_success" | "import_failure";

// Enrich data with source and id_erp_apprenant
function toEffectifsQueue(data: any[], organismeId: string) {
  return data.map((e) => ({
    ...e,
    source: String(organismeId),
    // Generate a unique id for each row, based on the apprenant's name and birthdate.
    // Source: https://mission-apprentissage.slack.com/archives/C02FR2L1VB8/p1693294663898159?thread_ts=1693292246.217809&cid=C02FR2L1VB8
    id_erp_apprenant: cyrb53Hash(
      normalize(e.prenom_apprenant || "").trim() +
        normalize(e.nom_apprenant || "").trim() +
        (e.date_de_naissance_apprenant || "").trim()
    ),
  }));
}

export default function Televersement({ organismeId, isMine }: { organismeId: string; isMine: boolean }) {
  const { toastError } = useToaster();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [data, setData] = useState<any[] | null>(null);
  const [errorsCount, setErrorsCount] = useState(0);
  const [status, setStatus] = useState<Status | null>(null);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    // On drop, read the file and parse it, then return data with validation errors.
    onDrop: (acceptedFiles: File[]) => {
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
                acc[header] = row[index];
              }
              return acc;
            }, {});
          });

        // Send data to API for validation.
        const res = await _post(
          `/api/v1/organismes/${organismeId}/upload/validate`,
          toEffectifsQueue(jsonData, organismeId)
        );

        // The response is an array of errors (zod)
        // Iterate over the array and add the error to the corresponding row
        const errors = res.error?.issues || [];
        setErrorsCount(errors.length);
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
      borderColor: "#E5E5E5",
      borderStyle: "dashed",
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
    const res = await _post(
      `/api/v1/organismes/${organismeId}/upload/import/v3`,
      toEffectifsQueue(data || [], organismeId)
    );
    setStatus(res.error ? "import_failure" : "import_success");
    setIsSubmitting(false);
  };

  if (status === "import_success") return <ImportSuccess isMine={isMine} organismeId={organismeId} />;

  return (
    <SimplePage title="Import des effectifs">
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb="4w">
          Import des effectifs
        </Heading>
        <InfoBetaPanel />
        <Button
          as="a"
          variant={"link"}
          fontSize="md"
          mt="2"
          borderBottom="1px"
          borderRadius="0"
          mb="8"
          lineHeight="6"
          p="0"
          _active={{
            color: "bluefrance",
          }}
          href="/modele-import.xlsx"
        >
          <FileDownloadIcon mr="2" />
          Télécharger le modèle
        </Button>

        {status === "validation_failure" && (
          <Ribbons variant="error" mb={8}>
            <Box mb="8">
              <Text fontSize="md" fontWeight="bold" mb="2" color="grey.800">
                {errorsCount} erreurs ont été détectées dans votre fichier.
              </Text>
              <Text fontSize="sm" color="grey.800">
                Vous pouvez voir le détail ligne à ligne ci-dessous. Vous devez modifier votre fichier et
                l&apos;importer à nouveau.
              </Text>
            </Box>
          </Ribbons>
        )}

        {status === "validation_success" && (
          <Ribbons variant="success" mb={8}>
            <Box mb="8">
              <Text fontSize="md" fontWeight="bold" mb="2" color="grey.800">
                Aucune erreur n&apos;a été détectée dans votre fichier.
              </Text>
              <Text fontSize="sm" color="grey.800">
                Vous pouvez relire le détail ligne à ligne ci-dessous. Si vous êtes satisfait, vous pouvez valider
                l&apos;import.
              </Text>
            </Box>
          </Ribbons>
        )}

        {data && headers && (
          <Box overflowX="auto" mb="8">
            <Table fontSize="sm">
              <Thead>
                <Tr>
                  <Th>#</Th>
                  <Th>Statut</Th>
                  {headers.map((key) => (
                    <Th key={key}>{key}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {data.map((row: any, index: number) => (
                  <Tr key={index}>
                    <Td>{index + 2}</Td>
                    <Td>
                      {row.errors.length === 0 ? (
                        <Flex color="green.500">
                          <CheckIcon />
                          <Text ml="2">Valide</Text>
                        </Flex>
                      ) : (
                        <Flex color="red.500">
                          <WarningTwoIcon />
                          <Text ml="2">{row.errors.length}&nbsp;erreurs</Text>
                        </Flex>
                      )}
                    </Td>
                    {headers.map((key) => {
                      if (row.errors.length > 0) {
                        const error = row.errors.find((e: any) => e.key === key);
                        if (error) {
                          return (
                            <Td key={key}>
                              <Text color="grey.500">{row[key] || "Donnée manquante"}</Text>
                              <Text color="red.500">{error.message.replace("String", "Texte")}</Text>
                            </Td>
                          );
                        }
                      }
                      return <Td key={key}>{row[key]}</Td>;
                    })}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

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
          <Box {...getRootProps<any>({ style })} mb={8} minH="200px">
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
        <Ribbons variant="success" mb={8}>
          <Box mb="8">
            <Text fontSize="md" fontWeight="bold" mb="2">
              Import réussi !
            </Text>
            <Text fontSize="md" color="grey.800">
              Vous pourrez consulter vos effectifs dans quelques minutes, le temps que le traitement soit effectué.
            </Text>
          </Box>
        </Ribbons>
        <Button
          as="a"
          href={isMine ? "/effectifs" : `/organismes/${organismeId}/effectifs`}
          variant="secondary"
          fontWeight="normal"
        >
          Voir mes effectifs
        </Button>
      </Container>
    </SimplePage>
  );
}

function InfoBetaPanel() {
  return (
    <Ribbons variant="info" mb={6}>
      <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
        Service d’import de vos effectifs en version bêta.
      </Text>
      <Text color="grey.800" mt={4} textStyle="sm">
        Ce service est en cours de refonte, nous travaillons actuellement à le rendre pleinement fonctionnel.
        <br />
        Si vous constatez un dysfonctionnement lors de son utilisation, contactez-nous&nbsp;:{" "}
        <a target="_blank" rel="noopener noreferrer" href="mailto:tableau-de-bord@apprentissage.beta.gouv.fr">
          tableau-de-bord@apprentissage.beta.gouv.fr
        </a>
        .
        <br />
        Nous vous prions de bien vouloir nous excuser pour l’éventuel désagrément rencontré et vous remercions de votre
        patience.
      </Text>
    </Ribbons>
  );
}

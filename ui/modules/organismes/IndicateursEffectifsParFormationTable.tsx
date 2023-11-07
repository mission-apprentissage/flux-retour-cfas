import { ArrowForwardIcon, ChevronDownIcon } from "@chakra-ui/icons";
import {
  Badge,
  HStack,
  Link,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";

import { _get } from "@/common/httpClient";

import { AbandonsIcon, ApprentisIcon, InscritsSansContratsIcon, RupturantsIcon } from "../dashboard/icons";
import { niveauFormationByNiveau } from "../indicateurs/filters/FiltreFormationNiveau";
import { IndicateursEffectifsAvecFormation } from "../models/indicateurs";

interface CustomColumnDef {
  accessorKey: string;
  header: () => string | JSX.Element;
  style?: any;
}

const formationsTableColumnsDefs: CustomColumnDef[] = [
  {
    accessorKey: "intitule_long",
    header: () => "Niveau et intitulé de la formation",
    style: {
      width: "100%",
    },
  },
  {
    accessorKey: "apprentis",
    header: () => (
      <>
        <ApprentisIcon w="16px" />
        <Text as="span" ml={2} fontSize="sm">
          Apprentis
        </Text>
      </>
    ),
  },
  {
    accessorKey: "inscritsSansContrat",
    header: () => (
      <>
        <InscritsSansContratsIcon w="16px" />
        <Text as="span" ml={2} fontSize="sm">
          Sans contrat
        </Text>
      </>
    ),
  },
  {
    accessorKey: "rupturants",
    header: () => (
      <>
        <RupturantsIcon w="16px" />
        <Text as="span" ml={2} fontSize="sm">
          Ruptures
        </Text>
      </>
    ),
  },
  {
    accessorKey: "abandons",
    header: () => (
      <>
        <AbandonsIcon w="16px" />
        <Text as="span" ml={2} fontSize="sm">
          Sorties
        </Text>
      </>
    ),
  },
];

interface NiveauAvecFormations {
  niveau: string;
  label: string;
  formations: IndicateursEffectifsAvecFormation[];
}

interface IndicateursEffectifsParFormationTableProps {
  formations: IndicateursEffectifsAvecFormation[];
}
function IndicateursEffectifsParFormationTable(props: IndicateursEffectifsParFormationTableProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCodeRNCP, setSelectedCodeRNCP] = useState<string | null>(null);

  const { data: ficheRNCP } = useQuery(["/api/v1/rncp", selectedCodeRNCP], async () => {
    if (selectedCodeRNCP) {
      const ficheRNCP = await _get(`/api/v1/rncp/${selectedCodeRNCP}`);
      onOpen();
      return ficheRNCP;
    } else {
      return {};
    }
  });
  const [expandedNiveaux, setExpandedNiveaux] = useState<{ [niveau: string]: boolean }>({});

  function toggleExpand(niveau: string) {
    expandedNiveaux[niveau] = !expandedNiveaux[niveau];
    setExpandedNiveaux({ ...expandedNiveaux });
  }

  const niveauxAvecFormations = useMemo(() => {
    return Object.values(
      props.formations.reduce<{ [key: string]: NiveauAvecFormations }>((acc, formation) => {
        let formationsNiveau = acc[formation.rncp?.niveau];
        if (!formationsNiveau) {
          formationsNiveau = acc[formation.rncp?.niveau] = {
            niveau: formation.rncp?.niveau,
            label: niveauFormationByNiveau[formation.rncp?.niveau] ?? "Sans niveau",
            formations: [],
          };
        }
        formationsNiveau.formations.push(formation);
        return acc;
      }, {})
    ).sort((a, b) => (a.niveau < b.niveau ? -1 : 1));
  }, [props.formations]);

  return (
    <>
      <Table className="stripped-bgcolor-even" variant="primary">
        <Thead position="sticky" top="0" zIndex="1" background="#ffffff">
          <Tr>
            {formationsTableColumnsDefs.map((columnDef) => (
              <Th key={columnDef.accessorKey} {...columnDef?.style}>
                {columnDef.header()}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody fontSize="zeta">
          {niveauxAvecFormations.map((niveauAvecFormations) => (
            <Fragment key={niveauAvecFormations.niveau}>
              <Tr key={niveauAvecFormations.niveau}>
                <Td
                  background="#F5F5FE"
                  color="bluefrance"
                  fontWeight="bold"
                  fontSize="zeta"
                  colSpan={100}
                  cursor="pointer"
                  title="Cliquer pour afficher/masquer le détail"
                  lineHeight="3em"
                  borderBottom=".5px solid bluefrance"
                  onClick={() => toggleExpand(niveauAvecFormations.niveau)}
                >
                  <ChevronDownIcon
                    boxSize="6"
                    transform={expandedNiveaux[niveauAvecFormations.niveau] ? "rotate(-180deg)" : ""}
                    transition=".3s"
                  />
                  {niveauAvecFormations.label}
                </Td>
              </Tr>

              {expandedNiveaux[niveauAvecFormations.niveau] &&
                niveauAvecFormations.formations.map((formation) => (
                  <Tr key={formation.rncp_code}>
                    <Td>
                      {formation.rncp?.intitule ? (
                        <Link
                          display="block"
                          fontSize="1rem"
                          width="var(--chakra-sizes-lg)"
                          title={formation.rncp.intitule}
                          onClick={() => setSelectedCodeRNCP(formation.rncp_code)}
                        >
                          {formation.rncp?.intitule}
                        </Link>
                      ) : (
                        <Text fontSize="1rem">Fiche non trouvée</Text>
                      )}
                      <Text mt={2} color="#3A3A3A" fontSize="omega">
                        RNCP&nbsp;:{" "}
                        {formation.rncp_code ? (
                          formation.rncp_code
                        ) : (
                          <Text as="span" color="red">
                            INCONNU
                          </Text>
                        )}
                      </Text>
                    </Td>
                    <Td>{formation.apprentis}</Td>
                    <Td>{formation.inscritsSansContrat}</Td>
                    <Td>{formation.rupturants}</Td>
                    <Td>{formation.abandons}</Td>
                  </Tr>
                ))}
            </Fragment>
          ))}
        </Tbody>
      </Table>

      {ficheRNCP && (
        <Modal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedCodeRNCP(null);
          }}
          size="3xl"
        >
          <ModalOverlay />
          <ModalContent borderRadius="0" p="2w" pb="4w">
            <ModalHeader display="flex" alignItems="center" fontSize="24px" pl="0">
              <ArrowForwardIcon boxSize={"8"} mr="2" />
              {ficheRNCP.intitule}
            </ModalHeader>
            <ModalCloseButton size="lg" />
            <VStack borderWidth="1px" borderColor="bluefrance" p={6} alignItems="start" gap={2}>
              <HStack w="100%">
                <Text>Code RNCP&nbsp;:</Text>
                <TextBadge>{ficheRNCP.rncp}</TextBadge>

                <Link
                  variant="whiteBg"
                  href={`https://www.francecompetences.fr/recherche/rncp/${ficheRNCP.rncp?.substring(4)}`}
                  isExternal
                  ml="auto !important"
                >
                  Consulter la fiche
                </Link>
              </HStack>
              <HStack>
                <Text>État&nbsp;:</Text>
                <TextBadge>{ficheRNCP.etat_fiche}</TextBadge>
              </HStack>
              <HStack>
                <Text>Actif&nbsp;:</Text>
                <TextBadge>{ficheRNCP.actif ? "oui" : "non"}</TextBadge>
              </HStack>
              <HStack>
                <Text>Niveau de formation&nbsp;:</Text>
                <Badge
                  fontSize="epsilon"
                  textColor="grey.800"
                  paddingX="1w"
                  paddingY="2px"
                  backgroundColor="#ECEAE3"
                  textTransform="none"
                >
                  {niveauFormationByNiveau[ficheRNCP.niveau] ?? "Inconnu"}
                </Badge>
              </HStack>
              <HStack>
                <Text>Codes ROME&nbsp;:</Text>
                <TextBadge>{ficheRNCP.romes?.join(", ")}</TextBadge>
              </HStack>
            </VStack>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default IndicateursEffectifsParFormationTable;

function TextBadge({ children }: { children: string | JSX.Element }) {
  return (
    <Badge
      fontSize="epsilon"
      textColor="grey.800"
      paddingX="1w"
      paddingY="2px"
      backgroundColor="#ECEAE3"
      textTransform="none"
    >
      {children}
    </Badge>
  );
}

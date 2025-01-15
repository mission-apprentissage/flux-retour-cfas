import { ArrowForwardIcon, ChevronDownIcon } from "@chakra-ui/icons";
import {
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
} from "@chakra-ui/react";
import { Fragment, useCallback, useMemo, useState } from "react";
import { IndicateursEffectifsAvecFormation } from "shared";

import { _get } from "@/common/httpClient";

import { AbandonsIcon, ApprentisIcon, InscritsSansContratsIcon, RupturantsIcon } from "../dashboard/icons";
import { niveauFormationByNiveau } from "../indicateurs/filters/FiltreFormationNiveau";

import { CertificationDetails } from "./CertificationDetails/CertificationDetails";

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
    accessorKey: "inscrits",
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
  id: string;
  niveau: string | null;
  label: string;
  formations: IndicateursEffectifsAvecFormation[];
}

interface IndicateursEffectifsParFormationTableProps {
  formations: IndicateursEffectifsAvecFormation[];
}
function IndicateursEffectifsParFormationTable(props: IndicateursEffectifsParFormationTableProps) {
  const [selectedFormation, setSelectedFormation] = useState<IndicateursEffectifsAvecFormation | null>(null);
  const [expandedNiveaux, setExpandedNiveaux] = useState<{ [niveau: string]: boolean }>({});

  const niveauxAvecFormations: NiveauAvecFormations[] = useMemo(() => {
    const groupedByNiveau = props.formations.reduce<Map<string | null, NiveauAvecFormations>>((acc, formation) => {
      if (!acc.has(formation.niveau_europeen)) {
        acc.set(formation.niveau_europeen, {
          id: formation.niveau_europeen ?? "",
          niveau: formation.niveau_europeen,
          label: niveauFormationByNiveau[formation.niveau_europeen ?? ""] ?? "Niveau inconnu",
          formations: [],
        });
      }

      acc.get(formation.niveau_europeen)!.formations.push(formation);

      return acc;
    }, new Map());

    return Array.from(groupedByNiveau.values()).sort((a, b) => {
      if (a.niveau === null) {
        return 1;
      }

      if (b.niveau === null) {
        return -1;
      }

      return a.niveau.localeCompare(b.niveau);
    });
  }, [props.formations]);

  const toggleExpand = useCallback((niveauId: string) => {
    setExpandedNiveaux((current) => ({
      ...current,
      [niveauId]: !current[niveauId],
    }));
  }, []);

  const isExpanded = useCallback((niveauId: string): boolean => Boolean(expandedNiveaux[niveauId]), [expandedNiveaux]);

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
            <Fragment key={niveauAvecFormations.id}>
              <Tr key={niveauAvecFormations.id}>
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
                  onClick={() => toggleExpand(niveauAvecFormations.id)}
                >
                  <ChevronDownIcon
                    boxSize="6"
                    transform={isExpanded(niveauAvecFormations.id) ? "rotate(-180deg)" : ""}
                    transition=".3s"
                  />
                  {niveauFormationByNiveau[niveauAvecFormations.id] ?? "Niveau inconnu"}
                </Td>
              </Tr>

              {isExpanded(niveauAvecFormations.id) &&
                niveauAvecFormations.formations.map((formation) => (
                  <Tr key={formation.rncp_code}>
                    <Td>
                      {formation.intitule ? (
                        <Link
                          display="block"
                          fontSize="1rem"
                          width="var(--chakra-sizes-lg)"
                          title={formation.intitule}
                          onClick={() => setSelectedFormation(formation)}
                        >
                          {formation.intitule}
                        </Link>
                      ) : (
                        <Text fontSize="1rem">Certification non trouvée</Text>
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
                        {" / "}
                        CFD&nbsp;:{" "}
                        {formation.cfd_code ? (
                          formation.cfd_code
                        ) : (
                          <Text as="span" color="red">
                            INCONNU
                          </Text>
                        )}
                      </Text>
                    </Td>
                    <Td>{formation.apprentis}</Td>
                    <Td>{formation.inscrits}</Td>
                    <Td>{formation.rupturants}</Td>
                    <Td>{formation.abandons}</Td>
                  </Tr>
                ))}
            </Fragment>
          ))}
        </Tbody>
      </Table>

      {selectedFormation !== null && (
        <Modal isOpen={selectedFormation !== null} onClose={() => setSelectedFormation(null)} size="3xl">
          <ModalOverlay />
          <ModalContent borderRadius="0" p="2w" pb="4w">
            <ModalHeader display="flex" alignItems="center" fontSize="24px" pl="0">
              <ArrowForwardIcon boxSize={"8"} mr="2" />
              {selectedFormation.intitule ?? selectedFormation.rncp_code}
            </ModalHeader>
            <ModalCloseButton size="lg" />
            <CertificationDetails rncp_code={selectedFormation.rncp_code} cfd_code={selectedFormation.cfd_code} />
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default IndicateursEffectifsParFormationTable;

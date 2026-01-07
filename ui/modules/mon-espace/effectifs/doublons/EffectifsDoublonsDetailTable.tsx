import { Box, Table, Thead, Tbody, Tr, Th, Td, Text, Flex, Button, useDisclosure, Tag } from "@chakra-ui/react";
import { useRef, useEffect, useState } from "react";
import { DuplicateEffectifDetail, getStatut } from "shared";

import { formatPhoneNumber } from "@/app/_utils/phone.utils";
import { formatDateDayMonthYear } from "@/common/utils/dateUtils";
import { getNestedValue } from "@/common/utils/misc";
import { ScrollShadowBox } from "@/components/ScrollShadowBox/ScrollShadowBox";
import { usePlausibleTracking } from "@/hooks/plausible";
import { useDraggableScroll } from "@/hooks/useDraggableScroll";
import { useTopScrollSync } from "@/hooks/useTopScrollSync";

import EffectifDoublonDeleteAlertDialog from "./EffectifDoublonDeleteAlertDialog";

interface GroupItem {
  label: string;
  key: string;
  render?: (duplicate: DuplicateEffectifDetail) => React.ReactNode;
  isDate?: boolean;
}

const personalDetails = [
  { label: "Prénom", key: "apprenant.prenom" },
  { label: "Nom", key: "apprenant.nom" },
  { label: "Numéro INE", key: "apprenant.ine" },
  { label: "Date de naissance", key: "apprenant.date_de_naissance", isDate: true },
  { label: "Courriel", key: "apprenant.courriel" },
  {
    label: "Téléphone",
    key: "apprenant.telephone",
    render: (duplicate: DuplicateEffectifDetail) => formatPhoneNumber(duplicate.apprenant?.telephone) || "-",
  },
  { label: "Identifiant ERP", key: "id_erp_apprenant" },
  { label: "Année scolaire", key: "_id.annee_scolaire" },
];

const addressDetails = [
  { label: "Code Insee", key: "apprenant.adresse.code_insee" },
  { label: "Code postal", key: "apprenant.adresse.code_postal" },
  { label: "Commune", key: "apprenant.adresse.commune" },
  { label: "Département", key: "apprenant.adresse.departement" },
  { label: "Académie", key: "apprenant.adresse.academie" },
  { label: "Région", key: "apprenant.adresse.region" },
];

const formationDetails = [
  { label: "Libellé de la formation", key: "formation.libelle_long" },
  { label: "Code formation diplôme", key: "formation.cfd" },
  { label: "Code RNCP", key: "formation.rncp" },
  {
    label: "Période de formation",
    key: "formation.periode",
    render: (duplicate: DuplicateEffectifDetail) => {
      if (duplicate.formation?.periode && duplicate.formation.periode.length > 0) {
        const startPeriod = duplicate.formation.periode[0] || "Date de début inconnue";
        const endPeriod = duplicate.formation.periode[1] || "Date de fin inconnue";
        return `${startPeriod} - ${endPeriod}`;
      }
      return "";
    },
  },
  { label: "Année de la formation", key: "formation.annee" },
];

const FIXED_COLUMN_WIDTH = "250px";
const TABLE_MIN_WIDTH = "1130px";
const COLUMN_WIDTH = "440px";

const EffectifsDoublonsDetailTable = ({ data }: { data: any }) => {
  const { ref, onMouseUp, onMouseDown, isDragging } = useDraggableScroll();
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { isOpen: isOpenAlertDialog, onOpen: onOpenAlertDialog, onClose: onCloseAlertDialog } = useDisclosure();
  const [currentEffectifDuplicate, setCurrentEffectifDuplicate] = useState<DuplicateEffectifDetail>();

  const cancelRef = useRef();
  const tableRef = useRef<HTMLTableElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  useTopScrollSync(topScrollRef, ref);
  const [tableWidth, setTableWidth] = useState("0px");
  const hasMoreThanTwoDuplicates = data.duplicates.length > 2;

  const hasDifferences = (duplicates: DuplicateEffectifDetail[], attributeKey: string): boolean => {
    const values = duplicates.map((duplicate) =>
      attributeKey.includes(".") ? getNestedValue(duplicate, attributeKey) : duplicate[attributeKey]
    );
    const serializedValues = values.map((value) => (Array.isArray(value) ? JSON.stringify(value.sort()) : value));
    return new Set(serializedValues).size > 1;
  };

  useEffect(() => {
    if (tableRef.current) {
      setTableWidth(`${tableRef.current.offsetWidth}px`);
    }
  }, [tableRef.current?.offsetWidth]);

  const handleDialogOpen = (duplicate: DuplicateEffectifDetail) => {
    setCurrentEffectifDuplicate(duplicate);
    onOpenAlertDialog();
  };

  const handleDialogClose = () => {
    setCurrentEffectifDuplicate(undefined);
    onCloseAlertDialog();
  };

  const renderTableGroupHeader = (title: string, duplicates: DuplicateEffectifDetail[], icon: string) => (
    <Thead color="bluefrances">
      <Tr>
        <Th position="sticky" top="0" left="0" zIndex="11" color="black" bg="#E3E3FD" fontSize="12" py={3}>
          <Flex align="center" gap="1">
            <Box as="i" className={icon} />
            <Text>{title}</Text>
          </Flex>
        </Th>
        {duplicates.map((_, index) => (
          <Th bg="#E3E3FD" key={`${title}-header-${index}`} py={3}></Th>
        ))}
      </Tr>
    </Thead>
  );

  const renderHistoriqueStatut = (duplicates) => {
    const processedDuplicates = duplicates.map((duplicate) => ({
      ...duplicate,
      statut: {
        ...duplicate.statut,
        parcours: duplicate.statut?.parcours?.slice().reverse() || [],
      },
    }));

    const maxStatutParcoursLength = Math.max(...processedDuplicates.map((dup) => dup.statut?.parcours?.length || 0));

    return (
      <>
        {renderTableGroupHeader("Historique du statut", processedDuplicates, "ri-calendar-fill")}
        <Tbody>
          {Array.from({ length: maxStatutParcoursLength }).map((_, rowIndex) => (
            <Tr key={`statut-row-${rowIndex}`} fontSize="14" bg={rowIndex % 2 === 0 ? "grey.100" : "white"}>
              <Td
                fontWeight="bold"
                position="sticky"
                left="0"
                zIndex="10"
                py={3}
                bg={rowIndex % 2 === 0 ? "grey.100" : "white"}
              >
                {rowIndex === 0 ? "Statut actuel" : "Statut précédent"}
              </Td>

              {processedDuplicates.map((duplicate, duplicateIndex) => {
                const statut = duplicate.statut?.parcours?.[rowIndex];
                if (!statut) {
                  return (
                    <Td key={`duplicate-${duplicateIndex}-statut-${rowIndex}`} py={3} color="grey">
                      <Text as="i">Aucun statut</Text>
                    </Td>
                  );
                }
                return (
                  <Td
                    key={`duplicate-${duplicateIndex}-statut-${rowIndex}`}
                    py={3}
                    color={rowIndex === 0 ? "black" : "grey"}
                  >
                    <>
                      <Text as="b" display="block">
                        {getStatut(statut.valeur)}
                      </Text>
                      <Text display="block" fontSize={12}>
                        à la date du {formatDateDayMonthYear(statut.date)}
                      </Text>
                    </>
                  </Td>
                );
              })}
            </Tr>
          ))}
        </Tbody>
      </>
    );
  };

  const renderGroup = (group: GroupItem[], label: string, icon: string): JSX.Element => (
    <>
      {renderTableGroupHeader(label, data.duplicates, icon)}
      <Tbody>
        {group.map((attribute, rowIndex) => {
          const isDiff = hasDifferences(data.duplicates, attribute.key);
          return (
            <Tr key={attribute.label} fontSize="14">
              <Td
                fontWeight="bold"
                position="sticky"
                left="0"
                zIndex="10"
                bg={isDiff ? "red.50" : rowIndex % 2 === 0 ? "grey.100" : "white"}
                color={isDiff ? "red.500" : "inherit"}
                py={3}
              >
                {attribute.label}
              </Td>
              {data.duplicates.map((duplicate: DuplicateEffectifDetail, index: number) => {
                const value = attribute.render
                  ? attribute.render(duplicate)
                  : attribute.key.includes(".")
                    ? getNestedValue(duplicate, attribute.key)
                    : duplicate[attribute.key];
                const displayValue = attribute.isDate && value ? formatDateDayMonthYear(value) : value;
                return (
                  <Td
                    key={`${attribute.key}-${index}`}
                    bg={isDiff ? "red.50" : rowIndex % 2 === 0 ? "grey.100" : "white"}
                    color={isDiff ? "red.500" : "inherit"}
                    fontWeight={isDiff ? "bold" : "normal"}
                    py={3}
                  >
                    {displayValue}
                  </Td>
                );
              })}
            </Tr>
          );
        })}
      </Tbody>
    </>
  );

  const renderContrats = (duplicates) => {
    duplicates.forEach((duplicate) => {
      duplicate.contrats.sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime());
    });

    const maxContratsLength = Math.max(...duplicates.map((dup) => dup.contrats.length));

    return (
      <>
        {renderTableGroupHeader("Contrats", duplicates, "ri-draft-fill")}
        <Tbody>
          {Array.from({ length: maxContratsLength }).map((_, rowIndex) => (
            <Tr key={`contrat-row-${rowIndex}`} fontSize="14" bg={rowIndex % 2 === 0 ? "grey.100" : "white"}>
              <Td
                fontWeight="bold"
                position="sticky"
                left="0"
                zIndex="10"
                py={3}
                bg={rowIndex % 2 === 0 ? "grey.100" : "white"}
              >
                {rowIndex === 0 ? "Dernier contrat" : "Ancien contrat"}
              </Td>
              {duplicates.map((duplicate, duplicateIndex) => {
                const contrat = duplicate.contrats[rowIndex];
                if (!contrat) {
                  return (
                    <Td
                      key={`duplicate-${duplicateIndex}-contrat-${rowIndex}`}
                      py={3}
                      bg={rowIndex % 2 === 0 ? "grey.100" : "white"}
                      color="grey"
                    >
                      {<Text as="i">Aucun contrat</Text>}
                    </Td>
                  );
                }
                return (
                  <Td
                    key={`duplicate-${duplicateIndex}-contrat-${rowIndex}`}
                    py={3}
                    bg={rowIndex % 2 === 0 ? "grey.100" : "white"}
                    color={rowIndex === 0 ? "black" : "grey"}
                  >
                    {contrat ? (
                      <>
                        <Text display="block">
                          Début: <strong>{formatDateDayMonthYear(new Date(contrat.date_debut))}</strong>
                        </Text>
                        <Text display="block">Fin: {formatDateDayMonthYear(new Date(contrat.date_fin))}</Text>
                        {contrat.date_rupture && (
                          <Text display="block">Rupture: {formatDateDayMonthYear(new Date(contrat.date_rupture))}</Text>
                        )}
                        <Text>Cause de rupture: {contrat.cause_rupture || "NC"}</Text>
                      </>
                    ) : (
                      rowIndex === 0 && <Text as="i">Aucun contrat</Text>
                    )}
                  </Td>
                );
              })}
            </Tr>
          ))}
        </Tbody>
      </>
    );
  };

  return (
    <>
      <Box
        ref={topScrollRef}
        overflowX="auto"
        maxWidth={TABLE_MIN_WIDTH}
        bg="gray.100"
        h={hasMoreThanTwoDuplicates ? 4 : 0}
      >
        <Box minWidth={tableWidth} />
      </Box>

      <ScrollShadowBox scrollRef={ref} left={FIXED_COLUMN_WIDTH} bottom={hasMoreThanTwoDuplicates ? "18px" : "0"}>
        <Box
          ref={ref}
          position="relative"
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseUp}
          onMouseUp={onMouseUp}
          overflowX="auto"
          width="100%"
          maxWidth={TABLE_MIN_WIDTH}
          cursor={!hasMoreThanTwoDuplicates ? "default" : isDragging ? "grabbing" : "grab"}
          userSelect="none"
        >
          <Box as="div" display="inline-block" textAlign="left">
            <Table variant="simple" ref={tableRef}>
              <Thead position="sticky" top="0" bgColor="white" zIndex="10">
                <Tr borderBottom="3px solid" borderColor="bluefrance">
                  <Th
                    position="sticky"
                    left="0"
                    zIndex="10"
                    bgColor="white"
                    fontWeight="bold"
                    fontSize="0.9rem"
                    borderColor="grey.800"
                    color="grey.800"
                    textTransform="none"
                    letterSpacing="0px"
                    width={FIXED_COLUMN_WIDTH}
                    minWidth={FIXED_COLUMN_WIDTH}
                    maxWidth={FIXED_COLUMN_WIDTH}
                  >
                    Informations
                  </Th>
                  {data.duplicates.map((duplicate, index) => (
                    <Th
                      key={index}
                      fontWeight="bold"
                      fontSize="0.9rem"
                      borderColor="grey.800"
                      color="grey.800"
                      textTransform="none"
                      letterSpacing="0px"
                      width={COLUMN_WIDTH}
                      minWidth={COLUMN_WIDTH}
                      p="2"
                    >
                      <Flex justify="space-between" align="center">
                        <Text>Duplicat {index + 1}</Text>
                        {index === 0 && (
                          <Tag backgroundColor="#B8FEC9" color="#18753C" size="sm">
                            Dernier effectif transmis
                          </Tag>
                        )}
                        <Button
                          aria-label={`Supprimer duplicat ${index + 1}`}
                          variant="secondary"
                          onClick={() => {
                            trackPlausibleEvent("suppression_doublons_effectifs");
                            handleDialogOpen(duplicate);
                          }}
                        >
                          <Box as="i" className="ri-delete-bin-line" mr={2} />
                          <Text as="span">Supprimer</Text>
                        </Button>
                      </Flex>
                    </Th>
                  ))}
                </Tr>
              </Thead>
              {renderHistoriqueStatut(data.duplicates)}
              {renderGroup(personalDetails, "Apprenant", "ri-user-fill")}
              {renderGroup(addressDetails, "Adresse", "ri-home-4-fill")}
              {renderGroup(formationDetails, "Formation", "ri-graduation-cap-fill")}
              {renderContrats(data.duplicates)}
            </Table>
          </Box>
        </Box>
      </ScrollShadowBox>
      <EffectifDoublonDeleteAlertDialog
        cancelRef={cancelRef}
        isOpen={isOpenAlertDialog}
        onClose={handleDialogClose}
        duplicateDetail={currentEffectifDuplicate}
      />
    </>
  );
};

export default EffectifsDoublonsDetailTable;

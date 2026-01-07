import { SearchIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, HStack, Input, InputGroup, InputRightElement, Switch, Text } from "@chakra-ui/react";
import { Row } from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { IPaginationFilters } from "shared/models/routes/pagination";

import { effectifsExportColumns } from "@/common/exports";
import { Organisme } from "@/common/internal/Organisme";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import DownloadButton from "@/components/buttons/DownloadButton";
import TableWithApi from "@/components/Table/TableWithApi";

import EffectifTableDetails from "../EffectifsTableDetails";

import effectifsTableColumnsDefs from "./EffectifsColumns";
import EffectifsFilterPanel from "./EffectifsFilterPanel";

const DISPLAY_DOWNLOAD_BUTTON = false;
interface EffectifsTableProps {
  organisme: Organisme;
  organismesEffectifs: any[];
  filters: Record<string, string[]>;
  pagination: IPaginationFilters;
  search: string;
  onSearchChange: (search: string) => void;
  onFilterChange: (filters: Record<string, string[]>) => void;
  onTableChange: (pagination: IPaginationFilters) => void;
  total: number;
  availableFilters: Record<string, string[]>;
  resetFilters: () => void;
  isFetching: boolean;
  canEdit?: boolean;
}

const EffectifsTable = ({
  organisme,
  organismesEffectifs,
  filters,
  pagination,
  search,
  onSearchChange,
  onFilterChange,
  onTableChange,
  total,
  availableFilters,
  resetFilters,
  isFetching,
  canEdit,
}: EffectifsTableProps) => {
  const [localSearch, setLocalSearch] = useState(search || "");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  useEffect(() => {
    setLocalSearch(search || "");
  }, [search]);

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(event.target.value);
  };

  const onSearchButtonClick = () => {
    executeSearch();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      executeSearch();
    }
  };

  const executeSearch = () => {
    onSearchChange(localSearch);
  };

  const filteredEffectifs = showOnlyErrors
    ? organismesEffectifs.filter((effectif) => effectif.validation_errors?.length > 0)
    : organismesEffectifs;

  return (
    <Box mt={4}>
      <Box border="1px solid" borderColor="openbluefrance" p={4}>
        <HStack mb="4" spacing="8">
          <InputGroup>
            <Input
              type="text"
              name="search_organisme"
              placeholder="Rechercher un apprenant"
              value={localSearch}
              onChange={handleSearchInputChange}
              onKeyDown={handleKeyDown}
              flex="1"
              mr="2"
            />
            <InputRightElement>
              <Button backgroundColor="bluefrance" _hover={{ textDecoration: "none" }} onClick={onSearchButtonClick}>
                <SearchIcon textColor="white" />
              </Button>
            </InputRightElement>
          </InputGroup>
          {DISPLAY_DOWNLOAD_BUTTON && (
            <DownloadButton
              variant="primary"
              ml={2}
              w="25%"
              action={() => {
                exportDataAsXlsx(
                  `tdb-effectifs.xlsx`,
                  organismesEffectifs?.map((effectif) => ({
                    organisme_uai: organisme.uai,
                    organisme_siret: organisme.siret,
                    organisme_nom: organisme.raison_sociale,
                    organisme_nature: organisme.nature,
                    apprenant_nom: effectif.nom,
                    apprenant_prenom: effectif.prenom,
                    apprenant_date_de_naissance: effectif.date_de_naissance,
                    apprenant_statut: effectif.statut_courant,
                    formation_annee: effectif.formation?.annee,
                    formation_cfd: effectif.formation?.cfd,
                    formation_libelle_long: effectif.formation?.libelle_long,
                    formation_niveau: effectif.formation?.niveau,
                    formation_rncp: effectif.formation?.rncp,
                    formation_date_debut_formation: effectif.formation?.date_debut_formation,
                    formation_date_fin_formation: effectif.formation?.date_fin_formation,
                  })) || [],
                  effectifsExportColumns
                );
              }}
            >
              Télécharger la liste
            </DownloadButton>
          )}
        </HStack>
        <Divider mb="4" />
        <HStack justifyContent="space-between" alignItems="center">
          <EffectifsFilterPanel
            filters={filters}
            availableFilters={availableFilters}
            onFilterChange={onFilterChange}
            resetFilters={resetFilters}
          />
          <HStack mt={6}>
            <Switch
              variant="icon"
              isChecked={showOnlyErrors}
              onChange={(e) => {
                setShowOnlyErrors(e.target.checked);
              }}
            />
            <Text flexGrow={1}>Afficher uniquement les données en erreur</Text>
          </HStack>
        </HStack>
      </Box>

      <Text my={10} fontWeight="bold">
        {total} apprenant(es) trouvé(es)
      </Text>

      <TableWithApi
        data={filteredEffectifs}
        paginationState={pagination}
        total={total}
        columns={effectifsTableColumnsDefs}
        enableRowExpansion={true}
        onTableChange={onTableChange}
        isLoading={isFetching}
        renderSubComponent={(row: Row<any>) => <EffectifTableDetails row={row} canEdit={canEdit} />}
      />
    </Box>
  );
};

export default EffectifsTable;

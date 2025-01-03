import { Button, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

import ApprenantsFilterComponent from "./ApprenantsFilterComponent";

interface ApprenantsFilterPanelProps {
  filters: Record<string, string[]>;
  availableFilters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
  resetFilters: () => void;
}

const ApprenantsFilterPanel: React.FC<ApprenantsFilterPanelProps> = ({
  filters,
  availableFilters,
  onFilterChange,
  resetFilters,
}) => {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const handleCheckboxChange = (filterKey: string, selectedValues: string[]) => {
    const updatedFilters = { ...filters, [filterKey]: selectedValues };
    onFilterChange(updatedFilters);
  };

  return (
    <Stack spacing="0.5">
      <Text fontSize="zeta" fontWeight="extrabold">
        FILTRER PAR
      </Text>
      <Stack direction="row" spacing={4} wrap="wrap">
        {/* Année scolaire */}
        {availableFilters?.annee_scolaire && (
          <ApprenantsFilterComponent
            filterKey="annee_scolaire"
            displayName="Année scolaire"
            options={availableFilters.annee_scolaire}
            selectedValues={filters.annee_scolaire || []}
            onChange={(values) => handleCheckboxChange("annee_scolaire", values)}
            isOpen={openFilter === "annee_scolaire"}
            setIsOpen={(isOpen) => setOpenFilter(isOpen ? "annee_scolaire" : null)}
            sortOrder="desc"
          />
        )}

        {/* Formation */}
        {availableFilters?.formation_libelle_long && (
          <ApprenantsFilterComponent
            filterKey="formation_libelle_long"
            displayName="Formation"
            options={availableFilters.formation_libelle_long}
            selectedValues={filters.formation_libelle_long || []}
            onChange={(values) => handleCheckboxChange("formation_libelle_long", values)}
            isOpen={openFilter === "formation_libelle_long"}
            setIsOpen={(isOpen) => setOpenFilter(isOpen ? "formation_libelle_long" : null)}
          />
        )}

        {/* Statut courant */}
        {availableFilters?.statut_courant && (
          <ApprenantsFilterComponent
            filterKey="statut_courant"
            displayName="Statut"
            options={availableFilters.statut_courant}
            selectedValues={filters.statut_courant || []}
            onChange={(values) => handleCheckboxChange("statut_courant", values)}
            isOpen={openFilter === "statut_courant"}
            setIsOpen={(isOpen) => setOpenFilter(isOpen ? "statut_courant" : null)}
          />
        )}

        {/* Source */}
        {availableFilters?.source && (
          <ApprenantsFilterComponent
            filterKey="source"
            displayName="Source de la donnée"
            options={availableFilters.source}
            selectedValues={filters.source || []}
            onChange={(values) => handleCheckboxChange("source", values)}
            isOpen={openFilter === "source"}
            setIsOpen={(isOpen) => setOpenFilter(isOpen ? "source" : null)}
          />
        )}

        <Button variant="link" onClick={resetFilters} fontSize="omega">
          Réinitialiser
        </Button>
      </Stack>
    </Stack>
  );
};

export default ApprenantsFilterPanel;

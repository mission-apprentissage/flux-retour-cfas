import { Button, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

import EffectifsFilterComponent from "../../effectifs/engine/effectifsTable/EffectifsFilterComponent";

interface SIFAEffectifsFilterPanelProps {
  filters: Record<string, string[]>;
  availableFilters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
  resetFilters: () => void;
}

const SIFAEffectifsFilterPanel: React.FC<SIFAEffectifsFilterPanelProps> = ({
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
        {/* Source */}
        {availableFilters?.source && (
          <EffectifsFilterComponent
            filterKey="source"
            displayName="Source de la donnée"
            options={availableFilters.source}
            selectedValues={filters.source || []}
            onChange={(values) => handleCheckboxChange("source", values)}
            isOpen={openFilter === "source"}
            setIsOpen={(isOpen) => setOpenFilter(isOpen ? "source" : null)}
          />
        )}

        {/* Formation */}
        {availableFilters?.formation_libelle_long && (
          <EffectifsFilterComponent
            filterKey="formation_libelle_long"
            displayName="Formation"
            options={availableFilters.formation_libelle_long}
            selectedValues={filters.formation_libelle_long || []}
            onChange={(values) => handleCheckboxChange("formation_libelle_long", values)}
            isOpen={openFilter === "formation_libelle_long"}
            setIsOpen={(isOpen) => setOpenFilter(isOpen ? "formation_libelle_long" : null)}
          />
        )}

        <Button variant="link" onClick={resetFilters} fontSize="omega">
          Réinitialiser
        </Button>
      </Stack>
    </Stack>
  );
};

export default SIFAEffectifsFilterPanel;

import { Button, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

import { capitalizeWords } from "@/common/utils/stringUtils";
import FilterList from "@/components/Filter/FilterList";

interface ApprenantsFilterPanelProps {
  filters: Record<string, string[]>;
  availableFilters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
  resetFilters: () => void;
}

const ApprenantsFilterPanel: React.FC<ApprenantsFilterPanelProps> = ({ filters, onFilterChange, resetFilters }) => {
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
        {["rupture", "rqth", "mineur"].map((key) => (
          <FilterList
            key={key}
            filterKey={key}
            displayName={capitalizeWords(key)}
            options={["Oui", "Non"]}
            selectedValues={filters[key] || []}
            onChange={(values) => handleCheckboxChange(key, values)}
            isOpen={openFilter === key}
            setIsOpen={(isOpen) => setOpenFilter(isOpen ? key : null)}
            sortOrder="desc"
          />
        ))}

        <Button variant="link" onClick={resetFilters} fontSize="omega">
          Réinitialiser
        </Button>
      </Stack>
    </Stack>
  );
};

export default ApprenantsFilterPanel;
